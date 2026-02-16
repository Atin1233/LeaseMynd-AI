// @ts-nocheck - Supabase type inference issues
import { createClient } from "~/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lightbulb,
} from "lucide-react";
import { AnalyzeButton } from "./_components/AnalyzeButton";
import { ClauseAccordion } from "./_components/ClauseAccordion";
import { RiskGauge } from "./_components/RiskGauge";
import { MarketComparison } from "./_components/MarketComparison";
import { ExportPdfButton } from "./_components/ExportPdfButton";
import { ShareButton } from "./_components/ShareButton";
import { ImprovedLeaseGenerator } from "./_components/ImprovedLeaseGenerator";
import { LeaseQAPanel } from "./_components/LeaseQAPanel";
import { CompareClausesPanel } from "./_components/CompareClausesPanel";
import { NegotiationGuide } from "./_components/NegotiationGuide";
import type { Database } from "~/lib/supabase/types";

type Lease = Database["public"]["Tables"]["leases"]["Row"];
type LeaseAnalysis = Database["public"]["Tables"]["lease_analyses"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/dashboard");
  }

  // Type assertion for profile - Supabase type inference issue
  const typedProfile = profile as { organization_id: string };

  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (leaseError || !lease) {
    notFound();
  }

  // Type assertion to help TypeScript understand the type after null check
  // Supabase's type inference isn't working correctly, so we need explicit typing
  const typedLease = lease as Lease;

  if (typedLease.organization_id !== typedProfile.organization_id) {
    redirect("/dashboard");
  }

  // Get analysis if it exists (might not have one yet)
  const { data: analysisData, error: analysisError } = await supabase
    .from("lease_analyses")
    .select("*")
    .eq("lease_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  const analysis: LeaseAnalysis | null = analysisError ? null : (analysisData as LeaseAnalysis | null);

  const { data: clauses } = await supabase
    .from("clause_extractions")
    .select("*")
    .eq("lease_id", id)
    .order("category", { ascending: true });

  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", typedProfile.organization_id)
    .maybeSingle();
  const plan = (org as { plan?: string } | null)?.plan ?? "free";

  const isAnalyzed = typedLease.status === "analyzed" && analysis;
  const isPending = typedLease.status === "pending";
  const isProcessing = typedLease.status === "processing";
  const isFailed = typedLease.status === "failed";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to documents
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 mb-3 heading-font">
              {typedLease.title}
            </h1>
            <div className="flex items-center flex-wrap gap-4 text-sm text-stone-500">
              {typedLease.property_address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {typedLease.property_address}
                </span>
              )}
              {typedLease.property_type && (
                <span className="capitalize px-2 py-0.5 bg-stone-100 text-stone-600">
                  {typedLease.property_type}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date(typedLease.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {typedLease.page_count && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {typedLease.page_count} pages
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isPending && <AnalyzeButton leaseId={id} />}
            {isAnalyzed && (
              <>
                <ExportPdfButton leaseId={id} />
                <ShareButton leaseId={id} plan={plan} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Banners */}
      {isProcessing && (
        <div className="bg-amber-50 border border-amber-200 p-5 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-amber-800 font-medium">Analysis in Progress</h3>
            <p className="text-amber-700 text-sm">
              Your lease is being analyzed. This page will update when complete.
            </p>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="bg-red-50 border border-red-200 p-5 mb-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Analysis Failed</h3>
            <p className="text-red-700 text-sm">
              We couldn&apos;t analyze this lease. Please try uploading again.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="bg-white border border-stone-200 p-10 mb-8 text-center">
          <div className="w-14 h-14 bg-stone-100 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-7 h-7 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            Ready for Analysis
          </h3>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            This document has been uploaded and is ready for AI analysis.
          </p>
          <AnalyzeButton leaseId={id} />
        </div>
      )}

      {/* Analysis Results */}
      {isAnalyzed && analysis && (
        <>
          {/* Risk Score and Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-stone-200 p-6">
              <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                Risk Score
              </h2>
              <RiskGauge
                score={analysis.risk_score ?? 50}
                level={analysis.risk_level ?? "medium"}
              />
            </div>

            <div className="lg:col-span-2 bg-white border border-stone-200 p-6">
              <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">
                Summary
              </h2>
              <p className="text-stone-700 leading-relaxed">
                {analysis.executive_summary ?? "No summary available."}
              </p>

              <div className="mt-5 pt-5 border-t border-stone-100 flex items-center gap-4 text-xs text-stone-400">
                <span>
                  Analyzed{" "}
                  {new Date(analysis.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {analysis.processing_time_ms && (
                  <span>
                    {(analysis.processing_time_ms / 1000).toFixed(1)}s processing
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Critical Deficiencies (if any) */}
          {((analysis.analysis_metadata as any)?.criticalDeficiencies?.length > 0) && (
            <div className="bg-red-50 border border-red-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-red-800 mb-4 heading-font flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Critical Deficiencies (Deal-Killer Issues)
              </h2>
              <div className="space-y-4">
                {((analysis.analysis_metadata as any).criticalDeficiencies as any[]).map((item: any, index: number) => (
                  <div key={index} className="bg-white border border-red-100 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-red-900">{item.title}</h4>
                      {item.article_reference && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5">
                          {item.article_reference}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-700 mb-2">{item.description}</p>
                    {item.impact && (
                      <p className="text-xs text-red-600 mb-2">
                        <strong>Impact:</strong> {item.impact}
                      </p>
                    )}
                    {item.recommendation && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2">
                        <strong>Fix:</strong> {item.recommendation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Surprisingly Favorable Provisions (if any) */}
          {((analysis.analysis_metadata as any)?.surprisinglyFavorableProvisions?.length > 0) && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-emerald-800 mb-4 heading-font flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Surprisingly Favorable Provisions
              </h2>
              <div className="space-y-3">
                {((analysis.analysis_metadata as any).surprisinglyFavorableProvisions as any[]).map((item: any, index: number) => (
                  <div key={index} className="bg-white border border-emerald-100 p-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-emerald-900">{item.title}</h4>
                      {item.article_reference && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5">
                          {item.article_reference}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-600 mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Findings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <FindingsCard
              title="Strengths"
              icon={<CheckCircle className="w-4 h-4" />}
              items={(analysis.strengths as any) || []}
              variant="success"
            />
            <FindingsCard
              title="Concerns"
              icon={<AlertTriangle className="w-4 h-4" />}
              items={(analysis.concerns as any) || []}
              variant="warning"
            />
            <FindingsCard
              title="High Risk"
              icon={<XCircle className="w-4 h-4" />}
              items={(analysis.high_risk_items as any) || []}
              variant="danger"
            />
          </div>

          {/* Category Scores Breakdown */}
          {((analysis.analysis_metadata as any)?.categoryScores?.length > 0) && (
            <div className="bg-white border border-stone-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-stone-900 mb-5 heading-font">
                Detailed Category Scores
              </h2>
              <div className="space-y-4">
                {((analysis.analysis_metadata as any).categoryScores as any[]).map((category: any, index: number) => (
                  <div key={index} className="border border-stone-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-stone-800">{category.category_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          category.percentage >= 80 ? "text-emerald-600" :
                          category.percentage >= 60 ? "text-amber-600" :
                          "text-red-600"
                        }`}>
                          {category.points_earned}/{category.points_possible} ({category.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${
                          category.percentage >= 80 ? "bg-emerald-500" :
                          category.percentage >= 60 ? "bg-amber-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    {category.major_issues && category.major_issues.length > 0 && (
                      <div className="text-xs text-red-600 mt-2">
                        <strong>Issues:</strong> {category.major_issues.join("; ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Comparison */}
          <div className="mb-8">
            <MarketComparison 
              data={(analysis.market_comparison as any) || null} 
              leaseId={id}
            />
          </div>

          {/* Negotiation Priorities */}
          {((analysis.analysis_metadata as any)?.negotiationPriorities) && (
            <NegotiationPriorities 
              priorities={(analysis.analysis_metadata as any).negotiationPriorities} 
            />
          )}

          {/* Missing Clauses */}
          {((analysis.analysis_metadata as any)?.missingClauses?.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-amber-800 mb-4 heading-font flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Missing Protections
              </h2>
              <div className="space-y-3">
                {((analysis.analysis_metadata as any).missingClauses as any[]).map((item: any, index: number) => (
                  <div key={index} className="bg-white border border-amber-100 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-amber-900">{item.clause_type}</h4>
                      <span className={`text-xs px-2 py-0.5 capitalize ${
                        item.importance === "critical" ? "bg-red-100 text-red-700" :
                        item.importance === "high" ? "bg-amber-100 text-amber-700" :
                        "bg-stone-100 text-stone-600"
                      }`}>
                        {item.importance}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700 mb-2">{item.risk_if_missing}</p>
                    {item.suggested_language && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View suggested language
                        </summary>
                        <p className="mt-2 p-2 bg-blue-50 text-stone-700 font-mono text-xs">
                          {item.suggested_language}
                        </p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {((analysis.recommendations as any)?.length > 0) && (
            <div className="bg-white border border-stone-200 p-6 mb-8">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-stone-900 heading-font">
                  Recommendations
                </h2>
              </div>

              <div className="space-y-4">
                {((analysis.recommendations as any[]) || []).map((rec, index) => (
                  <RecommendationCard key={index} recommendation={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Final Assessment */}
          {((analysis.analysis_metadata as any)?.finalAssessment) && (
            <div className="bg-stone-50 border border-stone-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-stone-900 mb-3 heading-font">
                Final Assessment
              </h2>
              <p className="text-stone-700 leading-relaxed">
                {(analysis.analysis_metadata as any).finalAssessment}
              </p>
            </div>
          )}

          {/* Clause Breakdown */}
          {clauses && clauses.length > 0 && (
            <div className="bg-white border border-stone-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-stone-900 mb-5 heading-font">
                Clause Analysis
              </h2>
              <ClauseAccordion clauses={clauses} leaseId={id} analysisId={analysis.id} />
            </div>
          )}

          {/* Compare to standard template */}
          {clauses && clauses.length > 0 && (
            <CompareClausesPanel leaseId={id} />
          )}

          {/* What should I negotiate? - dedicated flow */}
          {clauses && clauses.length > 0 && (
            <NegotiationGuide leaseId={id} />
          )}

          {/* Ask about this lease (Q&A) */}
          <LeaseQAPanel leaseId={id} />

          {/* Generate Improved Lease */}
          <div id="improved" className="mb-8 scroll-mt-24">
            <ImprovedLeaseGenerator leaseId={id} hasAnalysis={true} />
          </div>
        </>
      )}
    </div>
  );
}

function FindingsCard({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  variant: "success" | "warning" | "danger";
}) {
  const styles = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      title: "text-emerald-800",
      count: "text-emerald-600",
      itemBg: "bg-emerald-100/50",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      title: "text-amber-800",
      count: "text-amber-600",
      itemBg: "bg-amber-100/50",
    },
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      title: "text-red-800",
      count: "text-red-600",
      itemBg: "bg-red-100/50",
    },
  };

  const s = styles[variant];

  return (
    <div className={`${s.bg} border ${s.border} p-5`}>
      <div className="flex items-center gap-2 mb-4">
        <span className={s.icon}>{icon}</span>
        <h3 className={`font-medium ${s.title}`}>{title}</h3>
        <span className={`ml-auto text-sm font-medium ${s.count}`}>
          {items?.length || 0}
        </span>
      </div>

      {items && items.length > 0 ? (
        <ul className="space-y-3">
          {items.slice(0, 5).map((item, index) => (
            <li key={index} className={`text-sm p-2 ${s.itemBg}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-stone-800">{item.title}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.article_reference && (
                    <span className="text-xs px-1.5 py-0.5 bg-stone-200 text-stone-600">
                      {item.article_reference}
                    </span>
                  )}
                  {item.priority && (
                    <span className={`text-xs px-1.5 py-0.5 capitalize ${
                      item.priority === "critical" ? "bg-red-200 text-red-800" :
                      item.priority === "high" ? "bg-amber-200 text-amber-800" :
                      "bg-stone-200 text-stone-700"
                    }`}>
                      {item.priority}
                    </span>
                  )}
                </div>
              </div>
              {item.description && (
                <p className="text-stone-600 text-xs mt-1">
                  {item.description}
                </p>
              )}
              {item.current_text && (
                <p className="text-xs text-stone-500 mt-1 italic border-l-2 border-stone-300 pl-2">
                  &quot;{item.current_text.substring(0, 100)}{item.current_text.length > 100 ? "..." : ""}&quot;
                </p>
              )}
              {item.economic_impact && (
                <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 ${
                  item.economic_impact === "catastrophic" ? "bg-red-100 text-red-700" :
                  item.economic_impact === "ongoing" ? "bg-amber-100 text-amber-700" :
                  "bg-stone-100 text-stone-600"
                }`}>
                  {item.economic_impact === "catastrophic" ? "⚠️ Catastrophic" :
                   item.economic_impact === "ongoing" ? "📉 Ongoing cost" :
                   "💰 One-time impact"}
                </span>
              )}
              {item.market_comparison && (
                <p className="text-xs text-stone-500 mt-1 italic">
                  vs. Market: {item.market_comparison}
                </p>
              )}
            </li>
          ))}
          {items.length > 5 && (
            <li className="text-xs text-stone-500 text-center pt-1">
              +{items.length - 5} more items
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">None identified</p>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: any }) {
  const priorityStyles = {
    critical: "bg-red-100 text-red-700",
    high: "bg-amber-100 text-amber-700",
    medium: "bg-stone-100 text-stone-700",
    low: "bg-stone-50 text-stone-500",
  };

  const difficultyLabels = {
    easy: "Easy to negotiate",
    medium: "Moderate difficulty",
    hard: "Difficult negotiation",
  };

  return (
    <div className="bg-stone-50 border border-stone-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-0.5 font-medium capitalize ${priorityStyles[recommendation.priority as keyof typeof priorityStyles] || priorityStyles.medium}`}
          >
            {recommendation.priority}
          </span>
          <h4 className="font-medium text-stone-900">{recommendation.title}</h4>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {recommendation.difficulty && (
            <span className="text-xs text-stone-400">
              {difficultyLabels[recommendation.difficulty as keyof typeof difficultyLabels]}
            </span>
          )}
          {recommendation.risk_reduction && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5">
              +{recommendation.risk_reduction} pts
            </span>
          )}
        </div>
      </div>

      {recommendation.current_text && (
        <div className="mb-3 bg-red-50 border border-red-100 p-3">
          <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Current Language</span>
          <p className="text-sm text-red-900 mt-1 font-mono">
            &quot;{recommendation.current_text}&quot;
          </p>
        </div>
      )}

      {recommendation.suggested_change && (
        <div className="mb-3 bg-emerald-50 border border-emerald-100 p-3">
          <span className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Suggested Revision</span>
          <p className="text-sm text-emerald-900 mt-1">
            {recommendation.suggested_change}
          </p>
        </div>
      )}

      {recommendation.business_rationale && (
        <div className="text-sm text-stone-600 mb-2">
          <span className="font-medium text-stone-700">Why it matters: </span>
          {recommendation.business_rationale}
        </div>
      )}

      {recommendation.trade_value && (
        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 inline-block">
          💡 Trade chip: {recommendation.trade_value}
        </div>
      )}
    </div>
  );
}

function NegotiationPriorities({ priorities }: { priorities: any }) {
  if (!priorities) return null;

  const sections = [
    { key: "must_fix", title: "🚨 Must Fix", subtitle: "Deal-breakers if not addressed", color: "red" },
    { key: "strongly_negotiate", title: "⚠️ Strongly Negotiate", subtitle: "High-value items worth significant effort", color: "amber" },
    { key: "nice_to_have", title: "✨ Nice to Have", subtitle: "Pursue if negotiation is going well", color: "blue" },
    { key: "accept_as_is", title: "✓ Accept As-Is", subtitle: "Acceptable despite imperfection", color: "stone" },
  ];

  const colors = {
    red: { bg: "bg-red-50", border: "border-red-200", title: "text-red-800", text: "text-red-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-800", text: "text-amber-700" },
    blue: { bg: "bg-blue-50", border: "border-blue-200", title: "text-blue-800", text: "text-blue-700" },
    stone: { bg: "bg-stone-50", border: "border-stone-200", title: "text-stone-800", text: "text-stone-600" },
  };

  const hasContent = sections.some(s => priorities[s.key]?.length > 0);
  if (!hasContent) return null;

  return (
    <div className="bg-white border border-stone-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-stone-900 mb-5 heading-font">
        📋 Negotiation Cheat Sheet
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const items = priorities[section.key];
          if (!items || items.length === 0) return null;

          const c = colors[section.color as keyof typeof colors];

          return (
            <div key={section.key} className={`${c.bg} border ${c.border} p-4`}>
              <h3 className={`font-semibold ${c.title} mb-1`}>{section.title}</h3>
              <p className="text-xs text-stone-500 mb-3">{section.subtitle}</p>
              <ul className="space-y-2">
                {items.map((item: string, idx: number) => (
                  <li key={idx} className={`text-sm ${c.text} flex items-start gap-2`}>
                    <span className="mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
