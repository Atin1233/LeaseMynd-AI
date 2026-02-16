"use client";

import { useState } from "react";
import { Handshake, Loader2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface NegotiationGuideProps {
  leaseId: string;
}

export function NegotiationGuide({ leaseId }: NegotiationGuideProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGetRecommendations() {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/lease-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          question:
            "What should I negotiate in this lease? Prioritize the top 5-7 items with specific clause references, reasoning, and suggested ask. Be practical and actionable.",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to get recommendations");
        return;
      }
      setAnswer(data.answer ?? "No recommendations generated.");
    } catch {
      setError("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="negotiation-guide" className="bg-white border border-stone-200 rounded-lg overflow-hidden mb-8 scroll-mt-24">
      <div
        className="border-b border-stone-200 bg-amber-50/80 px-5 py-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-stone-900 heading-font">
            What should I negotiate?
          </h2>
          <span className="text-xs bg-amber-200/60 text-amber-800 px-2 py-0.5 rounded">
            AI-powered
          </span>
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
            Get a tailored list of negotiation priorities based on this lease&apos;s terms, with specific clauses and suggested asks.
          </p>
          {!answer ? (
            <button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-amber-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Get negotiation recommendations
                </>
              )}
            </button>
          ) : (
            <div className="border border-stone-200 rounded-lg p-4 bg-white">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-stone-900 mb-2">Recommendations</h3>
                  <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none">
                    {answer}
                  </div>
                </div>
              </div>
              <button
                onClick={handleGetRecommendations}
                disabled={loading}
                className="mt-3 text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                Regenerate
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        </div>
      )}
    </div>
  );
}
