// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import {
  generateImprovedLease,
  generateRedlineChanges,
  generateCoverLetter,
} from "~/lib/lease-analysis/lease-redliner";
import type { LeaseAnalysisResult } from "~/lib/lease-analysis/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface GenerateRequest {
  leaseId: string;
  mode?: "full" | "changes_only";
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GenerateRequest;
    const { leaseId, mode = "full" } = body;

    if (!leaseId) {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    // Fetch lease and verify ownership
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    // Verify user belongs to the lease's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.organization_id !== lease.organization_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if lease has been analyzed
    const { data: analysis, error: analysisError } = await supabase
      .from("lease_analyses")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Lease must be analyzed before generating improvements" },
        { status: 400 }
      );
    }

    // Fetch the original lease content
    const { data: chunks, error: chunksError } = await supabase
      .from("lease_chunks")
      .select("content, page, chunk_index")
      .eq("lease_id", leaseId)
      .order("page", { ascending: true })
      .order("chunk_index", { ascending: true });

    if (chunksError || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "Original lease content not found" },
        { status: 422 }
      );
    }

    const originalContent = chunks.map((c) => c.content).join("\n\n");

    // Reconstruct analysis result from database
    const metadata = analysis.analysis_metadata as Record<string, unknown> | null;
    const propertyDetails = metadata?.propertyDetails as Record<string, unknown> | undefined;
    
    const analysisResult: LeaseAnalysisResult = {
      executive_summary: analysis.executive_summary || "",
      risk_score: analysis.risk_score || 50,
      risk_level: analysis.risk_level || "medium",
      overall_assessment: (metadata?.overallAssessment as string) || undefined,
      strengths: (analysis.strengths as any[]) || [],
      concerns: (analysis.concerns as any[]) || [],
      high_risk_items: (analysis.high_risk_items as any[]) || [],
      recommendations: (analysis.recommendations as any[]) || [],
      clauses: [],
      property_details: propertyDetails ? {
        address: propertyDetails.address as string | undefined,
        property_type: propertyDetails.property_type as string | undefined,
        square_footage: propertyDetails.square_footage as string | undefined,
        lease_term: propertyDetails.lease_term as string | undefined,
        commencement_date: propertyDetails.commencement_date as string | undefined,
        expiration_date: propertyDetails.expiration_date as string | undefined,
        base_rent: propertyDetails.base_rent as string | undefined,
        monthly_rent: propertyDetails.monthly_rent as string | undefined,
        rent_escalation: propertyDetails.rent_escalation as string | undefined,
        security_deposit: propertyDetails.security_deposit as string | undefined,
        tenant_improvement_allowance: propertyDetails.tenant_improvement_allowance as string | undefined,
      } : undefined,
      missing_clauses: (metadata?.missingClauses as any[]) || [],
      negotiation_priorities: (metadata?.negotiationPriorities as any) || undefined,
    };

    // Fetch clauses for complete analysis
    const { data: clauses } = await supabase
      .from("clause_extractions")
      .select("*")
      .eq("lease_id", leaseId);

    if (clauses) {
      analysisResult.clauses = clauses.map((c) => ({
        category: c.category,
        subcategory: c.subcategory || undefined,
        clause_type: c.clause_type,
        original_text: c.original_text,
        plain_english_explanation: c.plain_english_explanation || undefined,
        risk_impact: c.risk_impact || undefined,
        is_standard: c.is_standard,
        recommendations: c.recommendations || undefined,
      }));
    }

    let result;

    try {
      if (mode === "changes_only") {
        // Faster mode - just get the list of changes
        console.log("Generating redline changes only...");
        const changes = await generateRedlineChanges(originalContent, analysisResult);
        console.log(`Generated ${changes.length} changes`);
        
        const coverLetter = await generateCoverLetter(changes, {
          address: lease.property_address || undefined,
        });

        result = {
          changes,
          summary: {
            total_changes: changes.length,
            critical_changes: changes.filter((c) => c.priority === "critical").length,
            high_changes: changes.filter((c) => c.priority === "high").length,
            medium_changes: changes.filter((c) => c.priority === "medium").length,
            low_changes: changes.filter((c) => c.priority === "low").length,
          },
          negotiation_cover_letter: coverLetter,
        };
      } else {
        // Full mode - generate complete improved document
        console.log("Generating full improved lease...");
        result = await generateImprovedLease(originalContent, analysisResult);
        console.log(`Generated improved lease with ${result.summary?.total_changes || 0} changes`);
      }
    } catch (generationError) {
      console.error("Error during lease generation:", generationError);
      throw new Error(
        `Failed to generate improved lease: ${
          generationError instanceof Error ? generationError.message : "Unknown error"
        }`
      );
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...result,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    console.error("Generate improved lease error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorStack,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate improved lease",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
