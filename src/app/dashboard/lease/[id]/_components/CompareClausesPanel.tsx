"use client";

import { useState, useEffect } from "react";
import { FileDiff, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Comparison {
  category: string;
  clause_type: string;
  deviation: string;
  favors: string;
  recommendation: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
}

interface CompareClausesPanelProps {
  leaseId: string;
}

export function CompareClausesPanel({ leaseId }: CompareClausesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparisons, setComparisons] = useState<Comparison[] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/templates");
        const data = await res.json();
        const list = data.templates ?? [];
        setTemplates(list.filter((t: { is_prebuilt?: boolean }) => t.is_prebuilt));
      } catch {
        setTemplates([]);
      }
    }
    loadTemplates();
  }, []);

  async function handleCompare() {
    setLoading(true);
    setError(null);
    setComparisons(null);
    try {
      const res = await fetch("/api/compare-clauses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          templateId: selectedTemplateId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Comparison failed");
        return;
      }
      setComparisons(data.comparisons ?? []);
      setExpanded(true);
    } catch {
      setError("Failed to compare clauses");
    } finally {
      setLoading(false);
    }
  }

  const favorsColor = (f: string) => {
    if (f === "tenant") return "text-emerald-600";
    if (f === "landlord") return "text-red-600";
    return "text-stone-500";
  };

  return (
    <div id="compare-clauses" className="bg-white border border-stone-200 rounded-lg overflow-hidden mb-8 scroll-mt-24">
      <div
        className="border-b border-stone-200 bg-stone-50 px-5 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <FileDiff className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-stone-900 heading-font">
            Compare to standard template
          </h2>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-stone-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-stone-500" />
        )}
      </div>
      {expanded && (
        <div className="p-5">
          <p className="text-sm text-stone-500 mb-4">
            Compare this lease&apos;s clauses against a standard template to see deviations and negotiation opportunities.
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white min-w-[200px]"
            >
              <option value="">Market standard (generic)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCompare}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Comparing…
                </>
              ) : (
                <>
                  <FileDiff className="h-4 w-4" />
                  Compare clauses
                </>
              )}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          {comparisons && comparisons.length > 0 && (
            <div className="space-y-4 mt-4 border-t border-stone-200 pt-4">
              {comparisons.map((c, i) => (
                <div
                  key={i}
                  className="border border-stone-200 rounded-lg p-4 bg-stone-50/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-stone-900">
                      {c.category} — {c.clause_type}
                    </span>
                    <span className={`text-xs font-medium capitalize ${favorsColor(c.favors)}`}>
                      Favors {c.favors}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 mb-2">{c.deviation}</p>
                  <p className="text-sm text-blue-700 font-medium">{c.recommendation}</p>
                </div>
              ))}
            </div>
          )}
          {comparisons && comparisons.length === 0 && !loading && (
            <p className="text-sm text-stone-500 mt-4">
              No notable deviations found. The lease appears aligned with standard terms.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
