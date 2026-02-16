// @ts-nocheck - Supabase type inference issues
import { createClient } from "~/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Shield,
  GitCompare,
  FileDown,
} from "lucide-react";
import { ActivityFeed } from "./_components/ActivityFeed";
import { OnboardingTooltip } from "./_components/OnboardingTooltip";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Fetch organization separately
  let org = null;
  if (profile?.organization_id) {
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();
    org = orgData;
  }

  if (!profile?.organization_id) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-stone-100 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-stone-400" />
          </div>
          <h2 className="text-2xl font-semibold text-stone-900 mb-3 heading-font">
            Complete Your Setup
          </h2>
          <p className="text-stone-500 mb-8 max-w-md mx-auto">
            Add your organization details to start analyzing lease documents.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium py-3 px-6 hover:bg-blue-700 transition-colors"
          >
            Complete Setup
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Get leases with analyses
  const { data: leases } = await supabase
    .from("leases")
    .select(
      `
      id,
      title,
      property_address,
      property_type,
      status,
      created_at,
      lease_analyses (
        id,
        risk_score,
        risk_level,
        created_at
      )
    `
    )
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate stats
  const totalLeases = leases?.length || 0;
  const analyzedLeases = leases?.filter((l) => l.status === "analyzed").length || 0;
  const avgRiskScore =
    analyzedLeases > 0
      ? Math.round(
          (leases
            ?.filter((l) => l.lease_analyses?.[0]?.risk_score)
            .reduce((acc, l) => acc + (l.lease_analyses?.[0]?.risk_score || 0), 0) || 0) /
            analyzedLeases
        )
      : null;

  const highRiskCount =
    leases?.filter(
      (l) =>
        l.lease_analyses?.[0]?.risk_level === "high" ||
        l.lease_analyses?.[0]?.risk_level === "critical"
    ).length || 0;

  const analysesRemaining = org
    ? org.monthly_analysis_limit === -1 ? 999 : (org.monthly_analysis_limit || 3) - (org.analyses_used_this_month || 0)
    : 0;

  const mostRecentAnalyzed = leases?.find((l) => l.status === "analyzed");
  const reportHref = mostRecentAnalyzed
    ? `/dashboard/lease/${mostRecentAnalyzed.id}`
    : "/dashboard/library";

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Onboarding Tooltip - Client Component */}
      <div suppressHydrationWarning>
        <OnboardingTooltip totalLeases={totalLeases} analyzedLeases={analyzedLeases} />
      </div>

      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-2 heading-font">
          Welcome back
        </h1>
        <p className="text-sm sm:text-base text-stone-500 mb-6">
          {analyzedLeases > 0
            ? `You've analyzed ${analyzedLeases} lease${analyzedLeases !== 1 ? "s" : ""} this month.`
            : "Upload a lease document to get started with AI analysis."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/dashboard/upload"
            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-5 hover:bg-blue-700 transition-all duration-200 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </Link>
          <Link
            href="/dashboard/portfolio"
            className="flex items-center justify-center gap-2 border border-stone-300 text-stone-700 font-medium py-2.5 px-5 hover:bg-stone-50 transition-all duration-200"
            title="Portfolio view: list and compare risk across leases"
          >
            <GitCompare className="w-4 h-4" />
            Compare Leases
          </Link>
          <Link
            href={reportHref}
            className="flex items-center justify-center gap-2 border border-stone-300 text-stone-700 font-medium py-2.5 px-5 hover:bg-stone-50 transition-all duration-200"
            title={mostRecentAnalyzed ? "Export PDF report for your latest lease" : "Pick a lease to generate report"}
          >
            <FileDown className="w-4 h-4" />
            Generate Report
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <MetricCard
          label="Documents"
          value={totalLeases}
          subtext={`${analyzedLeases} analyzed`}
          icon={<FileText className="w-5 h-5" />}
        />
        <MetricCard
          label="Avg. Score"
          value={avgRiskScore !== null ? avgRiskScore : "—"}
          subtext={avgRiskScore !== null ? getScoreLabel(avgRiskScore) : "No data yet"}
          icon={<TrendingUp className="w-5 h-5" />}
          valueColor={avgRiskScore !== null ? getScoreColor(avgRiskScore) : undefined}
        />
        <MetricCard
          label="High Risk"
          value={highRiskCount}
          subtext="Needs review"
          icon={<AlertCircle className="w-5 h-5" />}
          valueColor={highRiskCount > 0 ? "text-amber-600" : undefined}
        />
        <MetricCard
          label="Remaining"
          value={analysesRemaining}
          subtext={org?.monthly_analysis_limit === -1 ? "Unlimited" : `of ${org?.monthly_analysis_limit || 3} this month`}
          icon={<Shield className="w-5 h-5" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
        {/* Recent Documents - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-stone-900 heading-font">Recent Documents</h2>
          </div>

          {totalLeases === 0 ? (
            <div className="bg-white border border-stone-200 p-12 text-center">
              <div className="w-14 h-14 bg-stone-100 flex items-center justify-center mx-auto mb-5">
                <FileText className="w-7 h-7 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">
                No documents yet
              </h3>
              <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                Upload your first lease to get AI-powered risk analysis and recommendations.
              </p>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-5 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Upload Document
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-4">
                      Document
                    </th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">
                      Type
                    </th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">
                      Date
                    </th>
                    <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-4">
                      Status
                    </th>
                    <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-6 py-4">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {leases?.map((lease) => {
                    const analysis = (lease.lease_analyses as any)?.[0];
                    const riskScore = analysis?.risk_score;
                    const riskLevel = analysis?.risk_level;

                    return (
                      <tr key={lease.id} className="hover:bg-stone-50 transition-colors animate-fade-in">
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <Link href={`/dashboard/lease/${lease.id}`} className="group">
                            <div className="font-medium text-sm sm:text-base text-stone-900 group-hover:text-blue-600 transition-colors">
                              {lease.title}
                            </div>
                            {lease.property_address && (
                              <div className="text-xs sm:text-sm text-stone-500 mt-0.5 line-clamp-1">
                                {lease.property_address}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          {lease.property_type && (
                            <span className="text-xs sm:text-sm text-stone-600 capitalize">
                              {lease.property_type}
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {new Date(lease.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <StatusBadge status={lease.status} />
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                          {lease.status === "analyzed" && riskScore !== null ? (
                            <ScoreBadge score={riskScore} level={riskLevel} />
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Feed - Takes 1 column */}
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  valueColor,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="bg-white border border-stone-200 p-4 sm:p-5 card-hover">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className="text-stone-400">{icon}</span>
        <span className="text-xs sm:text-sm font-medium text-stone-500">{label}</span>
      </div>
      <div className={`text-2xl sm:text-3xl font-semibold mb-1 ${valueColor || "text-stone-900"}`}>
        {value}
      </div>
      <div className="text-xs sm:text-sm text-stone-500">{subtext}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    analyzed: {
      label: "Analyzed",
      className: "bg-emerald-50 text-emerald-700",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    processing: {
      label: "Processing",
      className: "bg-amber-50 text-amber-700",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    pending: {
      label: "Pending",
      className: "bg-stone-100 text-stone-600",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-700",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  };

  const { label, className, icon } = config[status as keyof typeof config] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 ${className}`}>
      {icon}
      {label}
    </span>
  );
}

function ScoreBadge({ score, level }: { score: number; level: string }) {
  const colorClass = {
    low: "text-emerald-600",
    medium: "text-amber-600",
    high: "text-red-600",
    critical: "text-red-700",
  }[level] || "text-stone-600";

  return (
    <span className={`text-lg font-semibold ${colorClass}`}>
      {score}
    </span>
  );
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Low risk";
  if (score >= 60) return "Moderate risk";
  if (score >= 40) return "High risk";
  return "Critical";
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}
