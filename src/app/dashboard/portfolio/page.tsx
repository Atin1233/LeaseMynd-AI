"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Loader2,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Filter,
} from "lucide-react";

interface LeaseRow {
  id: string;
  title: string;
  property_address: string | null;
  property_type: string | null;
  status: string;
  created_at: string;
  page_count: number | null;
  risk_score: number | null;
  risk_level: string | null;
  analysis_id: string | null;
}

interface Summary {
  total: number;
  analyzed: number;
  pending: number;
  avg_risk: number | null;
  high_risk: number;
}

export default function PortfolioPage() {
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dueDiligence, setDueDiligence] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, [dueDiligence]);

  async function loadPortfolio() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio?dueDiligence=${dueDiligence ? "true" : "false"}`);
      const data = await res.json();
      setLeases(data.leases ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setLeases([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "csv" | "xlsx" = "csv") {
    setExporting(true);
    try {
      const res = await fetch(`/api/export-portfolio?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "xlsx" ? "xlsx" : "csv";
      a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  }

  const riskColor = (level: string | null) => {
    if (!level) return "text-stone-500";
    if (level === "low") return "text-emerald-600";
    if (level === "medium") return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900 heading-font mb-2">
            Portfolio
          </h1>
          <p className="text-stone-500">
            List and consolidated risk/insights across all leases. Export to CSV or Excel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={dueDiligence}
              onChange={(e) => setDueDiligence(e.target.checked)}
              className="rounded border-stone-300"
            />
            <Filter className="h-4 w-4" />
            Due diligence (analyzed only)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting || leases.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </button>
            <button
              onClick={() => handleExport("xlsx")}
              disabled={exporting || leases.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Total leases</p>
            <p className="text-2xl font-semibold text-stone-900">{summary.total}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Analyzed</p>
            <p className="text-2xl font-semibold text-stone-900">{summary.analyzed}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">Avg risk score</p>
            <p className="text-2xl font-semibold text-stone-900">
              {summary.avg_risk != null ? summary.avg_risk : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-500">High / critical risk</p>
            <p className="text-2xl font-semibold text-red-600">{summary.high_risk}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading portfolio…
        </div>
      ) : leases.length === 0 ? (
        <div className="rounded-lg border border-stone-200 bg-white p-12 text-center text-stone-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-stone-300" />
          <p className="font-medium text-stone-700">No leases yet</p>
          <p className="text-sm mt-1">
            {dueDiligence ? "No analyzed leases. Turn off due diligence filter or analyze leases first." : "Upload leases from New Analysis or Library."}
          </p>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:underline"
          >
            Upload leases
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-stone-700">Title</th>
                <th className="text-left py-3 px-4 font-medium text-stone-700">Property</th>
                <th className="text-left py-3 px-4 font-medium text-stone-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-stone-700">Risk</th>
                <th className="text-left py-3 px-4 font-medium text-stone-700">Date</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {leases.map((l) => (
                <tr key={l.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/lease/${l.id}`} className="font-medium text-stone-900 hover:underline">
                      {l.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {l.property_address ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3 flex-shrink-0" />
                        {l.property_address.slice(0, 30)}
                        {l.property_address.length > 30 ? "…" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 capitalize ${
                      l.status === "analyzed" ? "text-emerald-600" :
                      l.status === "failed" ? "text-red-600" : "text-stone-600"
                    }`}>
                      {l.status === "analyzed" && <CheckCircle2 className="h-4 w-4" />}
                      {l.status === "failed" && <AlertTriangle className="h-4 w-4" />}
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {l.risk_score != null ? (
                      <span className={riskColor(l.risk_level)}>
                        {l.risk_score} {l.risk_level ? `(${l.risk_level})` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 px-4 text-stone-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3" />
                    {new Date(l.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/dashboard/lease/${l.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
