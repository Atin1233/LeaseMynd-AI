"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, MapPin, BarChart3, RefreshCw, Loader2, Info, AlertCircle } from "lucide-react";
import { useToast } from "~/lib/hooks/use-toast";

interface Comparison {
  metric: string;
  label: string;
  yourValue: string;
  marketValue: string;
  difference: string;
  differencePercent: number;
  status: "favorable" | "unfavorable" | "neutral";
  explanation: string;
}

interface MarketComparisonData {
  benchmark: {
    region: string;
    property_type: string;
    building_class: string | null;
    sample_size: number | null;
  };
  comparisons: Comparison[];
  overallAssessment: string;
  savingsOpportunities: string[];
}

interface MarketComparisonProps {
  data: MarketComparisonData | null;
  leaseId: string;
}

export function MarketComparison({ data: initialData, leaseId }: MarketComparisonProps) {
  const toast = useToast();
  const [data, setData] = useState<MarketComparisonData | null>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateComparison = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/market-comparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leaseId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to generate market comparison");
      }

      const result = await response.json();
      setData(result.marketComparison);
      toast.success("Market comparison generated", {
        description: `Compared ${result.marketComparison.comparisons.length} metrics against ${result.marketComparison.benchmark.region} market`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate market comparison";
      setError(errorMessage);
      toast.error("Failed to generate comparison", {
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!data) {
    return (
      <div className="bg-white border border-stone-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-stone-900">
                  Market Comparison
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  Compare your lease terms against market benchmarks
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateComparison}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate Comparison
                </>
              )}
            </button>
          </div>
        </div>
        <div className="px-6 py-8">
          {error ? (
            <div className="bg-red-50 border border-red-200 p-4 mb-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 mb-1">Error generating comparison</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                Market Comparison Not Available
              </h3>
              <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                Generate a market comparison to see how your lease terms stack up against regional
                benchmarks. This analysis compares rent, CAM charges, TI allowances, and other key terms.
              </p>
              <button
                onClick={handleGenerateComparison}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Generate Comparison
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const favorableCount = data.comparisons.filter(c => c.status === "favorable").length;
  const unfavorableCount = data.comparisons.filter(c => c.status === "unfavorable").length;
  const neutralCount = data.comparisons.filter(c => c.status === "neutral").length;
  const totalComparisons = data.comparisons.length;
  const favorablePercent = totalComparisons > 0 ? Math.round((favorableCount / totalComparisons) * 100) : 0;

  return (
    <div className="bg-white border border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-stone-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-stone-900">
                Market Comparison
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-stone-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="font-medium">{data.benchmark.region}</span>
                </div>
                <span className="text-stone-300">•</span>
                <span className="capitalize">{data.benchmark.property_type}</span>
                {data.benchmark.building_class && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="font-medium">Class {data.benchmark.building_class}</span>
                  </>
                )}
                {data.benchmark.sample_size && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="text-stone-400">
                      {data.benchmark.sample_size.toLocaleString()} leases
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {data.benchmark.sample_size && (
              <span className="text-xs text-stone-400">
                Based on {data.benchmark.sample_size.toLocaleString()} leases
              </span>
            )}
            <button
              onClick={handleGenerateComparison}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh market comparison data"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {data.comparisons.length > 0 && (
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500"></div>
                <span className="text-stone-600">
                  <span className="font-semibold text-stone-900">{favorableCount}</span> Favorable
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500"></div>
                <span className="text-stone-600">
                  <span className="font-semibold text-stone-900">{unfavorableCount}</span> Unfavorable
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-stone-400"></div>
                <span className="text-stone-600">
                  <span className="font-semibold text-stone-900">{neutralCount}</span> Neutral
                </span>
              </div>
            </div>
            {favorablePercent >= 50 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {favorablePercent}% favorable terms
                </span>
              </div>
            )}
            {favorablePercent < 30 && unfavorableCount > favorableCount && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  Consider negotiation
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Overall Assessment */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Market Assessment</h3>
            <p className="text-blue-800 text-sm leading-relaxed">{data.overallAssessment}</p>
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      {data.comparisons.length > 0 ? (
        <div className="divide-y divide-stone-100">
          {data.comparisons.map((comparison, index) => {
            // Extract numeric values for visualization
            const yourNum = parseFloat(comparison.yourValue.replace(/[^0-9.]/g, ''));
            const marketNum = parseFloat(comparison.marketValue.replace(/[^0-9.]/g, ''));
            const hasNumericValues = !isNaN(yourNum) && !isNaN(marketNum);
            const maxValue = hasNumericValues ? Math.max(yourNum, marketNum) * 1.2 : 100;
            const yourPercent = hasNumericValues ? (yourNum / maxValue) * 100 : 0;
            const marketPercent = hasNumericValues ? (marketNum / maxValue) * 100 : 0;

            return (
              <div
                key={comparison.metric}
                className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-stone-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-stone-900">
                      {comparison.label}
                    </span>
                    {comparison.status === "favorable" && (
                      <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                    {comparison.status === "unfavorable" && (
                      <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    {comparison.status === "neutral" && (
                      <Minus className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-stone-500 mb-2">{comparison.explanation}</p>
                  
                  {/* Visual Bar Comparison */}
                  {hasNumericValues && (
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-stone-600 w-24 flex-shrink-0">Your Lease</span>
                        <div className="flex-1 bg-stone-100 h-3 relative overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              comparison.status === "favorable"
                                ? "bg-emerald-500"
                                : comparison.status === "unfavorable"
                                  ? "bg-red-500"
                                  : "bg-stone-400"
                            }`}
                            style={{ width: `${Math.min(yourPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-stone-900 w-20 text-right flex-shrink-0">
                          {comparison.yourValue}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-stone-600 w-24 flex-shrink-0">Market Avg</span>
                        <div className="flex-1 bg-stone-100 h-3 relative overflow-hidden">
                          <div
                            className="h-full bg-stone-400 transition-all duration-500"
                            style={{ width: `${Math.min(marketPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-stone-600 w-20 text-right flex-shrink-0">
                          {comparison.marketValue}
                        </span>
                      </div>
                      {Math.abs(comparison.differencePercent) > 1 && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-stone-500">Difference:</span>
                          <span className={`text-xs font-semibold ${
                            comparison.status === "favorable"
                              ? "text-emerald-600"
                              : comparison.status === "unfavorable"
                                ? "text-red-600"
                                : "text-stone-600"
                          }`}>
                            {comparison.difference} ({comparison.differencePercent > 0 ? "+" : ""}{comparison.differencePercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Desktop View: Side-by-side comparison */}
                <div className="hidden sm:flex items-center gap-6 ml-4 flex-shrink-0">
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-stone-400 mb-0.5">Your Lease</p>
                    <p className="font-semibold text-stone-900 text-lg">
                      {comparison.yourValue}
                    </p>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <p className="text-xs text-stone-400 mb-0.5">Market Avg</p>
                    <p className="font-medium text-stone-600 text-lg">
                      {comparison.marketValue}
                    </p>
                  </div>
                  {comparison.difference && (
                    <div
                      className={`text-right min-w-[100px] px-3 py-2 ${
                        comparison.status === "favorable"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : comparison.status === "unfavorable"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}
                    >
                      <p className="font-semibold text-sm">{comparison.difference}</p>
                      {Math.abs(comparison.differencePercent) > 0.1 && (
                        <p className="text-xs mt-0.5 opacity-75">
                          {comparison.differencePercent > 0 ? "+" : ""}
                          {comparison.differencePercent.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-8 text-center">
          <p className="text-stone-500 text-sm mb-4">
            Financial terms could not be extracted from this lease for market comparison.
            The AI analysis will still provide detailed clause-by-clause insights.
          </p>
          <button
            onClick={handleGenerateComparison}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Try Generating Comparison
              </>
            )}
          </button>
        </div>
      )}

      {/* Savings Opportunities */}
      {data.savingsOpportunities.length > 0 && (
        <div className="px-6 py-5 bg-gradient-to-br from-amber-50 to-orange-50 border-t border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900 text-lg">
              Negotiation Opportunities
            </h3>
          </div>
          <ul className="space-y-3">
            {data.savingsOpportunities.map((opportunity, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-amber-900 bg-white/60 p-3 border border-amber-200">
                <div className="w-5 h-5 bg-amber-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <span className="leading-relaxed">{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

