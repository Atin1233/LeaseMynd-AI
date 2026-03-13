// @ts-nocheck - Supabase type inference issues with profiles, leases, lease_analyses, etc.
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient, createAdminClient } from "~/lib/supabase/server";
import { getApiKeyAuth, touchApiKey } from "~/lib/auth/api-key";
import {
  analyzeLeaseDocument,
  getRiskLevel,
  type LeaseAnalysisResult,
  type ClauseExtraction,
} from "~/lib/lease-analysis";
import { getMarketBenchmark, compareToMarket } from "~/lib/lease-analysis/market-comparison";
import { withRateLimit, applyRateLimitHeaders } from "~/lib/rate-limit-middleware";
import { RateLimitPresets, createUserRateLimiter } from "~/lib/rate-limiter";
import { getCache, CacheKeys, CacheTTL } from "~/lib/cache";
import { getLogger, getPerformanceMonitor, PerformanceMetrics } from "~/lib/monitoring";
import { withRetry, classifyError, ErrorType } from "~/lib/utils/error-handler";
import { smartTruncate, chunkContent, createProcessingContext } from "~/lib/utils/token-manager";

export const runtime = "nodejs";
export const maxDuration = 300;

const logger = getLogger();
const performance = getPerformanceMonitor();
const cache = getCache();

interface AnalyzeRequest {
  leaseId: string;
  useAdvancedModel?: boolean;
  forceReanalyze?: boolean;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  performance.startTimer(PerformanceMetrics.LEASE_ANALYSIS_DURATION);
  logger.info("Analyze lease request started", { module: "analyze-lease" });

  try {
    const apiKeyAuth = await getApiKeyAuth(request);
    let supabase = await createClient();
    let user: { id: string } | null = null;
    let organizationId: string | null = null;

    if (apiKeyAuth) {
      organizationId = apiKeyAuth.organizationId;
      void touchApiKey(apiKeyAuth.keyId);
    } else {
      const { data: { user: u }, error: authError } = await supabase.auth.getUser();
      if (authError || !u) {
        logger.warn("Authentication failed", { module: "analyze-lease", error: authError?.message });
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      user = u;
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", u.id).maybeSingle();
      organizationId = profile?.organization_id ?? null;
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitKey = user?.id ?? apiKeyAuth?.keyId ?? "anon";
    const rateLimiter = createUserRateLimiter(rateLimitKey, RateLimitPresets.leaseAnalysis);
    const rateLimitInfo = await rateLimiter(request);

    if (!rateLimitInfo.allowed) {
      logger.warn("Rate limit exceeded", { module: "analyze-lease", rateLimitKey });
      const response = NextResponse.json(
        { error: "Rate limit exceeded", message: "Too many requests.", retryAfter: rateLimitInfo.retryAfter },
        { status: 429 }
      );
      return applyRateLimitHeaders(response, rateLimitInfo);
    }

    logger.debug("Authentication successful", { module: "analyze-lease", rateLimitKey });

    // Parse request body with error handling
    let body: AnalyzeRequest;
    try {
      body = (await request.json()) as AnalyzeRequest;
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { leaseId, useAdvancedModel = false, forceReanalyze = false } = body;

    if (!leaseId || typeof leaseId !== "string") {
      console.error("Invalid leaseId:", leaseId);
      return NextResponse.json(
        { error: "leaseId is required and must be a string" },
        { status: 400 }
      );
    }

    // Fetch lease and verify ownership
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*, organization_id")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    if (lease.organization_id !== organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already analyzed (skip if forceReanalyze is true)
    const { data: existingAnalysis, error: existingError } = await supabase
      .from("lease_analyses")
      .select("id, risk_score, risk_level, created_at")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingError && existingAnalysis && !forceReanalyze) {
      console.log("Returning cached analysis (use forceReanalyze: true to re-analyze)");
      const { data: fullAnalysis, error: fullAnalysisError } = await supabase
        .from("lease_analyses")
        .select("*")
        // @ts-expect-error - Supabase type inference issue
        .eq("id", existingAnalysis.id)
        .maybeSingle();

      if (!fullAnalysisError && fullAnalysis) {
        const { data: clauses } = await supabase
          .from("clause_extractions")
          .select("*")
          // @ts-expect-error - Supabase type inference issue
          .eq("analysis_id", existingAnalysis.id);

        return NextResponse.json({
          success: true,
          cached: true,
          analysis: fullAnalysis,
          clauses: clauses || [],
        });
      }
    }

    // Fetch all chunks for this lease
    const { data: chunks, error: chunksError } = await supabase
      .from("lease_chunks")
      .select("content, page, chunk_index")
      .eq("lease_id", leaseId)
      .order("page", { ascending: true })
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "No content found for this lease" },
        { status: 422 }
      );
    }

    // Combine chunks into full document text
    const fullContent = chunks.map((c) => c.content).join("\n\n");

    // Use smart truncation that preserves important content from beginning and end
    const maxContentLength = 25000;
    const { truncated: truncatedContent, wasTruncated } = smartTruncate(
      fullContent, 
      maxContentLength,
      3000 // Preserve last 3000 chars for signatures/dates
    );
    
    // Check if we need chunking for very long documents
    const chunkingResult = chunkContent(fullContent, { maxInputTokens: 6000 });
    const processingContext = createProcessingContext(chunkingResult);
    
    if (processingContext.needsChunking) {
      logger.info("Document requires chunking", {
        module: "analyze-lease",
        leaseId,
        totalChunks: chunkingResult.totalChunks,
        strategy: processingContext.strategy,
        estimatedTime: processingContext.estimatedTime,
      });
    }
    
    logger.debug("Content prepared for analysis", {
      module: "analyze-lease",
      originalLength: fullContent.length,
      truncatedLength: truncatedContent.length,
      wasTruncated,
    });

    // Update lease status to processing
    await supabase
      .from("leases")
      .update({ status: "processing" })
      .eq("id", leaseId);

    // Analyze with Google AI using the new 1000-point framework
    // Includes retry logic for transient failures
    let analysisResult: LeaseAnalysisResult & { _aiModel?: string; scoring_details?: any };
    try {
      logger.info("Starting AI analysis", {
        module: "analyze-lease",
        leaseId,
        contentLength: truncatedContent.length,
        hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
      });
      
      performance.startTimer(PerformanceMetrics.AI_API_LATENCY);
      
      // Use retry logic for AI analysis
      analysisResult = await withRetry(
        async () => analyzeLeaseDocument(truncatedContent, { useAdvancedModel }),
        {
          maxRetries: 2,
          baseDelay: 5000,
          maxDelay: 30000,
          onRetry: (attempt, error, nextDelay) => {
            logger.warn("AI analysis retry", {
              module: "analyze-lease",
              leaseId,
              attempt,
              errorType: error.type,
              nextDelay,
            });
          },
          isRetryable: (error) => {
            // Retry on rate limits, server errors, and parse errors
            return [ErrorType.RATE_LIMIT, ErrorType.SERVER, ErrorType.PARSE, ErrorType.NETWORK]
              .includes(error.type);
          },
        }
      );
      
      const aiDuration = performance.endTimer(PerformanceMetrics.AI_API_LATENCY, true, { leaseId });
      
      logger.info("AI analysis completed", {
        module: "analyze-lease",
        leaseId,
        durationMs: aiDuration,
        riskScore: analysisResult.risk_score,
        riskLevel: analysisResult.risk_level,
        concernsCount: analysisResult.concerns?.length || 0,
        highRiskCount: analysisResult.high_risk_items?.length || 0,
        missingClausesCount: analysisResult.missing_clauses?.length || 0,
        recommendationsCount: analysisResult.recommendations?.length || 0,
      });
    } catch (aiError) {
      const classifiedError = classifyError(aiError);
      performance.endTimer(PerformanceMetrics.AI_API_LATENCY, false, { leaseId, errorType: classifiedError.type });
      
      logger.error("AI analysis failed", aiError, {
        module: "analyze-lease",
        leaseId,
        errorType: classifiedError.type,
        retryable: classifiedError.retryable,
      });
      
      await supabase
        .from("leases")
        .update({ status: "failed" })
        .eq("id", leaseId);

      return NextResponse.json({
        error: classifiedError.userMessage,
        details: classifiedError.technicalDetails.substring(0, 2000),
        code: classifiedError.type,
        retryable: classifiedError.retryable,
      }, { status: classifiedError.statusCode || 500 });
    }

    // ============================================================
    // SIMPLIFIED SCORING - Use AI score directly
    // The new 1000-point framework calculates the score in the AI
    // No more overlapping calculations!
    // ============================================================
    
    const isNotALease = analysisResult.is_valid_lease === false;
    
    let finalRiskScore: number;
    let finalRiskLevel: string;
    
    if (isNotALease) {
      finalRiskScore = 0;
      finalRiskLevel = "critical";
      console.log("🚫 NOT A LEASE - Score: 0 (critical)");
    } else {
      // Use the AI's score directly - it's calculated from the 1000-point framework
      // Round to integer since database expects integer type
      finalRiskScore = Math.round(analysisResult.risk_score ?? 50);
      finalRiskScore = Math.max(0, Math.min(100, finalRiskScore));
      finalRiskLevel = getRiskLevel(finalRiskScore);
      console.log(`✅ Using AI Framework Score: ${finalRiskScore}% (${finalRiskLevel})`);
    }

    // Get market comparison data (optional enhancement)
    let marketComparison = null;
    try {
      const propertyType = analysisResult.property_details?.property_type || lease.property_type;
      const propertyAddress = analysisResult.property_details?.address || lease.property_address;
      
      let region = null;
      if (propertyAddress) {
        const match = propertyAddress.match(/([A-Za-z\s]+),\s*([A-Z]{2})/);
        if (match) {
          region = `${match[1].trim()}, ${match[2]}`;
        }
      }
      
      const benchmark = await getMarketBenchmark(region, propertyType);
      
      if (benchmark) {
        const propertyDetails = analysisResult.property_details || {};
        
        const extractNumber = (str: string | undefined): number | undefined => {
          if (!str) return undefined;
          const match = str.toString().replace(/[,$]/g, '').match(/(\d+\.?\d*)/);
          return match ? parseFloat(match[1]) : undefined;
        };
        
        const squareFootage = extractNumber(propertyDetails.square_footage as string);
        const baseRentStr = propertyDetails.base_rent as string || propertyDetails.monthly_rent as string;
        const baseRent = extractNumber(baseRentStr);
        
        let rentPerSf: number | undefined;
        if (baseRent && squareFootage) {
          const annualRent = baseRent < 50000 ? baseRent * 12 : baseRent;
          rentPerSf = annualRent / squareFootage;
        }
        
        const leaseTerms = {
          rentPerSf,
          hasRenewalOption: analysisResult.strengths?.some(s => 
            s.title?.toLowerCase().includes("renewal")
          ),
          hasEarlyTermination: analysisResult.strengths?.some(s => 
            s.title?.toLowerCase().includes("termination")
          ),
        };
        
        marketComparison = compareToMarket(leaseTerms, benchmark);
      }
    } catch (benchmarkError) {
      console.error("Market comparison failed:", benchmarkError);
    }

    const processingTime = Date.now() - startTime;

    // Store analysis in database
    console.log("Saving analysis to database...");

    let savedAnalysis;
    let analysisError;
    try {
      const result = await supabase
        .from("lease_analyses")
        .insert({
          lease_id: leaseId,
          risk_score: finalRiskScore,
          risk_level: finalRiskLevel,
          executive_summary: analysisResult.executive_summary,
          strengths: analysisResult.strengths || [],
          concerns: analysisResult.concerns || [],
          high_risk_items: analysisResult.high_risk_items || [],
          recommendations: analysisResult.recommendations || [],
          market_comparison: marketComparison,
          analysis_metadata: {
            chunksAnalyzed: chunks.length,
            contentLength: fullContent.length,
            truncated: fullContent.length > maxContentLength,
            propertyDetails: analysisResult.property_details,
            missingClauses: analysisResult.missing_clauses,
            negotiationPriorities: analysisResult.negotiation_priorities,
            scoringFramework: "1000-point-v2",
            scoringDetails: analysisResult.scoring_details,
            categoryScores: (analysisResult as any).category_scores || [],
            criticalDeficiencies: (analysisResult as any).critical_deficiencies || [],
            surprisinglyFavorableProvisions: (analysisResult as any).surprisingly_favorable_provisions || [],
            finalAssessment: (analysisResult as any).final_assessment,
          },
          processing_time_ms: processingTime,
          ai_model: analysisResult._aiModel || "gemini-2.0-flash",
        })
        .select()
        .maybeSingle();
      
      savedAnalysis = result.data;
      analysisError = result.error;
    } catch (insertError) {
      console.error("Database insert error:", insertError);
      analysisError = insertError instanceof Error ? insertError : new Error(String(insertError));
    }

    if (analysisError || !savedAnalysis) {
      console.error("Failed to save analysis:", analysisError);
      return NextResponse.json(
        { 
          error: "Failed to save analysis results",
          details: analysisError?.message || "Unknown database error",
        },
        { status: 500 }
      );
    }

    // Store extracted clauses if any
    const clausesToInsert = (analysisResult.clauses || []).map(
      (clause: ClauseExtraction) => ({
        lease_id: leaseId,
        analysis_id: savedAnalysis.id,
        category: clause.category || "Operational",
        subcategory: clause.subcategory || null,
        clause_type: clause.clause_type || "Unknown",
        original_text: clause.original_text || "",
        plain_english_explanation: clause.plain_english_explanation || null,
        risk_impact: clause.risk_impact ?? 0,
        risk_factors: clause.risk_factors || [],
        page_numbers: clause.page_estimate ? [clause.page_estimate] : null,
        is_standard: clause.is_standard ?? true,
        recommendations: clause.recommendations || [],
      })
    );

    if (clausesToInsert.length > 0) {
      const { error: clauseError } = await supabase
        .from("clause_extractions")
        .insert(clausesToInsert);

      if (clauseError) {
        console.error("Failed to save clauses:", clauseError);
      }
    }

    // Update lease status to analyzed
    await supabase
      .from("leases")
      .update({ status: "analyzed" })
      .eq("id", leaseId);

    // Update organization's analysis count
    try {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("analyses_used_this_month")
        .eq("id", lease.organization_id)
        .maybeSingle();

      if (!orgError && orgData) {
        await supabase
          .from("organizations")
          .update({
            analyses_used_this_month: (orgData.analyses_used_this_month || 0) + 1,
          })
          .eq("id", lease.organization_id);
      }
    } catch (countError) {
      console.error("Failed to update analysis count:", countError);
    }

    // Fire webhooks for analysis.completed (Growth+) — use admin client so delivery works for any user
    try {
      const adminSupabase = await createAdminClient();
      const { data: webhooks } = await adminSupabase
        .from("webhooks")
        .select("id, url, secret, events")
        .eq("organization_id", lease.organization_id)
        .eq("active", true);
      const list = (webhooks ?? []).filter(
        (w) => Array.isArray(w.events) && w.events.includes("analysis.completed")
      );
      const payload = {
        event: "analysis.completed",
        lease_id: leaseId,
        analysis_id: savedAnalysis.id,
        risk_score: finalRiskScore,
        risk_level: finalRiskLevel,
        created_at: new Date().toISOString(),
      };
      for (const w of list) {
        fetch(w.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-LeaseAI-Event": "analysis.completed",
            ...(w.secret ? { "X-LeaseAI-Signature": `sha256=${createHmac("sha256", w.secret).update(JSON.stringify(payload)).digest("hex")}` } : {}),
          },
          body: JSON.stringify(payload),
        }).catch((err) => logger.warn("Webhook delivery failed", { url: w.url, error: err?.message }));
      }
    } catch (webhookErr) {
      logger.warn("Webhooks fetch failed", { error: webhookErr });
    }

    // Fetch saved clauses
    const { data: savedClauses } = await supabase
      .from("clause_extractions")
      .select("*")
      .eq("analysis_id", savedAnalysis.id);

    // Cache the analysis result
    try {
      await cache.set(
        CacheKeys.analysis(leaseId),
        { analysisId: savedAnalysis.id, riskScore: finalRiskScore },
        { ttl: CacheTTL.LONG, tags: ['analysis', `lease:${leaseId}`] }
      );
    } catch (cacheError) {
      logger.warn("Failed to cache analysis result", { 
        module: "analyze-lease", 
        leaseId, 
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    const totalDuration = performance.endTimer(PerformanceMetrics.LEASE_ANALYSIS_DURATION, true, {
      leaseId,
      riskScore: finalRiskScore,
    });
    
    logger.info("Analyze lease request completed", {
      module: "analyze-lease",
      leaseId,
      processingTimeMs: processingTime,
      totalDurationMs: totalDuration,
      riskScore: finalRiskScore,
      riskLevel: finalRiskLevel,
    });

    const response = NextResponse.json({
      success: true,
      cached: false,
      analysis: savedAnalysis,
      clauses: savedClauses || [],
      processingTimeMs: processingTime,
    });
    
    // Apply rate limit headers to response
    return applyRateLimitHeaders(response, rateLimitInfo);
  } catch (error) {
    performance.endTimer(PerformanceMetrics.LEASE_ANALYSIS_DURATION, false);
    const classifiedError = classifyError(error);
    
    logger.error("Analyze lease request failed", error, {
      module: "analyze-lease",
      errorType: classifiedError.type,
    });
    
    return NextResponse.json({
      error: classifiedError.userMessage,
      details: classifiedError.technicalDetails.substring(0, 2000),
      code: classifiedError.type,
    }, { status: classifiedError.statusCode || 500 });
  }
}

// GET endpoint to fetch existing analysis
export async function GET(request: Request) {
  try {
    const apiKeyAuth = await getApiKeyAuth(request);
    const supabase = await createClient();
    let organizationId: string | null = null;

    if (apiKeyAuth) {
      organizationId = apiKeyAuth.organizationId;
      void touchApiKey(apiKeyAuth.keyId);
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
      organizationId = profile?.organization_id ?? null;
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get("leaseId");

    if (!leaseId) {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("organization_id")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease || lease.organization_id !== organizationId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch analysis
    const { data: analysis, error: analysisFetchError } = await supabase
      .from("lease_analyses")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisFetchError || !analysis) {
      return NextResponse.json(
        { error: "No analysis found for this lease" },
        { status: 404 }
      );
    }

    // Fetch clauses
    const { data: clauses } = await supabase
      .from("clause_extractions")
      .select("*")
      .eq("analysis_id", analysis.id);

    return NextResponse.json({
      success: true,
      analysis,
      clauses: clauses || [],
    });
  } catch (error) {
    console.error("Get analysis error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
