"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp,
  Lightbulb,
  ExternalLink,
  Loader2,
} from "lucide-react";

type Tab = "uploaded" | "improved";

interface LeaseForLibrary {
  id: string;
  title: string;
  propertyAddress: string | null;
  propertyType: string | null;
  status: string;
  pageCount: number | null;
  createdAt: string;
  analysis: {
    id: string;
    riskScore: number | null;
    riskLevel: string | null;
    executiveSummary: string | null;
    analyzedAt: string;
    strengths: any[];
    concerns: any[];
    highRiskItems: any[];
    missingClauses: any[];
    recommendations: any[];
    marketComparison: any;
    negotiationPriorities?: any;
  } | null;
  clauses: any[];
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("uploaded");
  const [leases, setLeases] = useState<LeaseForLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadLeases();
  }, []);

  async function loadLeases() {
    setLoading(true);
    try {
      const res = await fetch("/api/library/leases");
      const data = await res.json();
      setLeases(data.leases ?? []);
    } catch (e) {
      console.error("Library load error:", e);
      setLeases([]);
    } finally {
      setLoading(false);
    }
  }

  const uploaded = leases;
  const improvedCandidates = leases.filter((l) => l.status === "analyzed" && l.analysis);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 heading-font mb-2">
          Library
        </h1>
        <p className="text-stone-500">
          Browse uploaded leases, view analysis and vulnerabilities, and manage improved versions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 mb-8">
        <button
          onClick={() => setTab("uploaded")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "uploaded"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Uploaded Leases
        </button>
        <button
          onClick={() => setTab("improved")}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "improved"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Improved Leases
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
        </div>
      ) : tab === "uploaded" ? (
        <UploadedLeasesList
          leases={uploaded}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        />
      ) : (
        <ImprovedLeasesTab leases={improvedCandidates} />
      )}
    </div>
  );
}

function UploadedLeasesList({
  leases,
  expandedId,
  onToggle,
}: {
  leases: LeaseForLibrary[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  if (leases.length === 0) {
    return (
      <div className="bg-white border border-stone-200 p-12 text-center">
        <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-stone-900 mb-2">No leases yet</h3>
        <p className="text-stone-500 mb-6 max-w-sm mx-auto">
          Upload leases from the dashboard to see them here with full analysis and vulnerabilities.
        </p>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 bg-stone-900 text-white font-medium py-2.5 px-5 hover:bg-stone-800 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Upload a lease
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leases.map((lease) => (
        <div
          key={lease.id}
          className="bg-white border border-stone-200 overflow-hidden"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => onToggle(lease.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle(lease.id);
              }
            }}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-stone-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-stone-500" />
              </div>
              <div>
                <div className="font-medium text-stone-900">{lease.title}</div>
                <div className="flex items-center gap-3 mt-0.5 text-sm text-stone-500">
                  {lease.propertyAddress && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {lease.propertyAddress}
                    </span>
                  )}
                  {lease.propertyType && (
                    <span className="capitalize">{lease.propertyType}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(lease.createdAt).toLocaleDateString("en-US")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lease.analysis && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-semibold ${
                      (lease.analysis.riskLevel === "low" && "text-emerald-600") ||
                      (lease.analysis.riskLevel === "medium" && "text-amber-600") ||
                      (lease.analysis.riskLevel === "high" && "text-red-600") ||
                      "text-red-700"
                    }`}
                  >
                    {lease.analysis.riskScore ?? "—"}
                  </span>
                  <span className="text-xs text-stone-400 uppercase">
                    {lease.analysis.riskLevel ?? "—"}
                  </span>
                </div>
              )}
              <Link
                href={`/dashboard/lease/${lease.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View full <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              {expandedId === lease.id ? (
                <ChevronDown className="w-5 h-5 text-stone-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-stone-400" />
              )}
            </div>
          </div>

          {expandedId === lease.id && (
            <div className="border-t border-stone-200 bg-stone-50">
              <div className="px-6 py-5">
                {lease.analysis ? (
                  <div className="space-y-6">
                    {lease.analysis.executiveSummary && (
                      <div>
                        <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                          Summary
                        </h4>
                        <p className="text-sm text-stone-700">
                          {lease.analysis.executiveSummary}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <VulnBlock
                        title="Strengths"
                        items={lease.analysis.strengths}
                        icon={CheckCircle}
                        variant="success"
                      />
                      <VulnBlock
                        title="Concerns"
                        items={lease.analysis.concerns}
                        icon={AlertTriangle}
                        variant="warning"
                      />
                      <VulnBlock
                        title="High risk"
                        items={lease.analysis.highRiskItems}
                        icon={XCircle}
                        variant="danger"
                      />
                    </div>

                    {lease.analysis.missingClauses && lease.analysis.missingClauses.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Missing protections
                        </h4>
                        <ul className="space-y-2">
                          {lease.analysis.missingClauses.map((m: any, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-stone-700 bg-amber-50 border border-amber-200 px-3 py-2"
                            >
                              <span className="font-medium">{m.clause_type ?? m}</span>
                              {m.risk_if_missing && (
                                <span className="text-stone-600"> — {m.risk_if_missing}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lease.analysis.recommendations && lease.analysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Lightbulb className="w-3.5 h-3.5" />
                          Top recommendations
                        </h4>
                        <ul className="space-y-2">
                          {lease.analysis.recommendations.slice(0, 5).map((r: any, i: number) => (
                            <li key={i} className="text-sm text-stone-700 flex items-start gap-2">
                              <span className="text-stone-400 mt-0.5">•</span>
                              <span>
                                <span className="font-medium">{r.title}</span>
                                {r.suggested_change && (
                                  <span className="text-stone-600"> — {String(r.suggested_change).slice(0, 120)}…</span>
                                )}
                              </span>
                            </li>
                          ))}
                          {lease.analysis.recommendations.length > 5 && (
                            <li className="text-sm text-stone-500">
                              +{lease.analysis.recommendations.length - 5} more — see full lease for all
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Link
                        href={`/dashboard/lease/${lease.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
                      >
                        Full analysis <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      {lease.status === "analyzed" && (
                        <Link
                          href={`/dashboard/lease/${lease.id}#improved`}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Generate improved
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-stone-500 mb-4">
                      {lease.status === "pending" && "This lease is ready for analysis."}
                      {lease.status === "processing" && "Analysis in progress."}
                      {lease.status === "failed" && "Analysis failed. Try re-uploading."}
                    </p>
                    <Link
                      href={`/dashboard/lease/${lease.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Open lease <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VulnBlock({
  title,
  items,
  icon: Icon,
  variant,
}: {
  title: string;
  items: any[];
  icon: React.ComponentType<{ className?: string }>;
  variant: "success" | "warning" | "danger";
}) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    danger: "bg-red-50 border-red-200 text-red-800",
  };
  const list = Array.isArray(items) ? items : [];
  return (
    <div className={`border p-4 ${styles[variant]}`}>
      <h4 className="text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" />
        {title} ({list.length})
      </h4>
      <ul className="space-y-1.5 text-sm">
        {list.slice(0, 4).map((item: any, i: number) => (
          <li key={i} className="line-clamp-2">
            {item.title ?? item.clause_type ?? (typeof item === "string" ? item : null)}
          </li>
        ))}
        {list.length > 4 && (
          <li className="text-stone-500 text-xs">+{list.length - 4} more</li>
        )}
      </ul>
    </div>
  );
}

function ImprovedLeasesTab({ leases }: { leases: LeaseForLibrary[] }) {
  if (leases.length === 0) {
    return (
      <div className="bg-white border border-stone-200 p-12 text-center">
        <TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-stone-900 mb-2">No improved leases yet</h3>
        <p className="text-stone-500 mb-6 max-w-md mx-auto">
          Open an analyzed lease and use &ldquo;Generate improved&rdquo; to create a tenant-favorable version.
          You can view and download it on the lease detail page.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-stone-900 text-white font-medium py-2.5 px-5 hover:bg-stone-800 transition-colors"
        >
          Go to overview
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 mb-4">
        Open a lease to generate or view its improved version. Improved documents are created on the lease detail page.
      </p>
      {leases.map((lease) => (
        <Link
          key={lease.id}
          href={`/dashboard/lease/${lease.id}`}
          className="block bg-white border border-stone-200 p-5 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-medium text-stone-900">{lease.title}</div>
                <div className="text-sm text-stone-500 mt-0.5">
                  {lease.propertyAddress ?? "No address"} • Score {lease.analysis?.riskScore ?? "—"}
                </div>
              </div>
            </div>
            <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
              Generate improved <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
