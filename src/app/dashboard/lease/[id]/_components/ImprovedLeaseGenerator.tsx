"use client";

import { useState } from "react";
import {
  Wand2,
  Loader2,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Download,
  FileDown,
} from "lucide-react";
import { generateLeasePdf } from "~/lib/pdf/generate-lease-pdf";
import { useToast } from "~/lib/hooks/use-toast";

interface RedlineChange {
  section: string;
  original_text: string;
  revised_text: string;
  change_type: "deletion" | "addition" | "modification";
  priority: "critical" | "high" | "medium" | "low";
  rationale: string;
  negotiation_note: string;
  risk_reduction?: number;
}

interface ImprovedLeaseResult {
  improved_document?: string;
  changes: RedlineChange[];
  summary: {
    total_changes: number;
    critical_changes: number;
    high_changes: number;
    medium_changes: number;
    low_changes: number;
    estimated_score_improvement?: number;
  };
  negotiation_cover_letter: string;
  issues_addressed?: string[];
  issues_remaining?: string[];
  processingTimeMs: number;
}

interface ImprovedLeaseGeneratorProps {
  leaseId: string;
  hasAnalysis: boolean;
}

export function ImprovedLeaseGenerator({
  leaseId,
  hasAnalysis,
}: ImprovedLeaseGeneratorProps) {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ImprovedLeaseResult | null>(null);
  const [expandedChange, setExpandedChange] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"changes" | "document" | "letter">("changes");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate(mode: "full" | "changes_only") {
    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate-improved-lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId, mode }),
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        let errorMessage = "Failed to generate improved lease";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = `${response.status}: ${response.statusText}`;
        }
        toast.error("Failed to generate improved lease", {
          description: errorMessage,
        });
        console.error("API error:", response.status, errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setActiveTab("changes");
        toast.success("Improved lease generated successfully!", {
          description: `Found ${data.summary?.total_changes || 0} recommended changes`,
        });
      } else {
        toast.error("Failed to generate improved lease", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Generate error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to generate improved lease", {
        description: errorMessage,
      });
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadAsText(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportAsPdf() {
    if (!result) {
      toast.warning("No improved lease data available", {
        description: "Please generate the improved lease first",
      });
      return;
    }

    try {
      // Validate that we have content to generate PDF
      if (!result.improved_document && (!result.changes || result.changes.length === 0)) {
        toast.warning("No content available", {
          description: "Please generate the improved lease first",
        });
        return;
      }

      // Generate and download PDF immediately (client-side)
      generateLeasePdf({
        title: "Commercial Lease Agreement",
        propertyAddress: undefined,
        preparedBy: "Tenant",
        improvedDocument: result.improved_document || "",
        changes: (result.changes || []).map(c => ({
          section: c.section || "Unknown Section",
          original_text: c.original_text || "",
          revised_text: c.revised_text || "",
          priority: c.priority || "medium",
          rationale: c.rationale || "",
        })),
        coverLetter: result.negotiation_cover_letter || "",
      });
      toast.success("PDF generated successfully", {
        description: "The improved lease PDF is ready for download",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to generate PDF", {
        description: errorMessage,
      });
    }
  }

  const priorityStyles = {
    critical: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
    high: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
    medium: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
    low: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-200" },
  };

  if (!hasAnalysis) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-none p-6 text-center">
        <Wand2 className="w-8 h-8 text-stone-400 mx-auto mb-3" />
        <h3 className="font-medium text-stone-700 mb-2">Generate Improved Version</h3>
        <p className="text-sm text-stone-500">
          Analyze this lease first to generate an improved version with suggested revisions.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-none p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-none flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900 mb-1">
              Generate Improved Lease
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              Create a tenant-favorable version that fixes all identified issues.
              Downloads as a ready-to-use PDF contract.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleGenerate("changes_only")}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-300 text-blue-700 rounded-none hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Quick Preview
              </button>

              <button
                onClick={() => handleGenerate("full")}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate Final Contract
              </button>
            </div>

            {generating && (
              <p className="text-sm text-blue-600 mt-3">
                ⏳ Generating improved contract... This may take 30-60 seconds.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-none overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-none flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Improved Contract Ready</h3>
              <p className="text-sm text-stone-500">
                {result.summary.total_changes} revisions •{" "}
                {result.summary.estimated_score_improvement && (
                  <span className="text-emerald-600 font-medium">
                    +{result.summary.estimated_score_improvement} pts •{" "}
                  </span>
                )}
                {(result.processingTimeMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportAsPdf}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-none hover:bg-emerald-700 transition-colors font-medium"
            >
              <FileDown className="w-4 h-4" />
              Download Final PDF
            </button>
            <button
              onClick={() => setResult(null)}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              Regenerate
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          {result.summary.critical_changes > 0 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-none">
              {result.summary.critical_changes} Critical
            </span>
          )}
          {result.summary.high_changes > 0 && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-none">
              {result.summary.high_changes} High
            </span>
          )}
          {result.summary.medium_changes > 0 && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-none">
              {result.summary.medium_changes} Medium
            </span>
          )}
          {result.summary.low_changes > 0 && (
            <span className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-none">
              {result.summary.low_changes} Low
            </span>
          )}
          {result.issues_addressed && result.issues_addressed.length > 0 && (
            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-none">
              ✓ {result.issues_addressed.length} issues fixed
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab("changes")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "changes"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          All Revisions ({result.changes.length})
        </button>
        {result.improved_document && (
          <button
            onClick={() => setActiveTab("document")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "document"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            Full Contract
          </button>
        )}
        <button
          onClick={() => setActiveTab("letter")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "letter"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          Cover Letter
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "changes" && (
          <div className="space-y-4">
            {result.changes.map((change, index) => {
              const priority = change.priority as keyof typeof priorityStyles;
              const styles = priorityStyles[priority] || priorityStyles.medium;
              const isExpanded = expandedChange === index;

              return (
                <div
                  key={index}
                  className={`border ${styles.border} rounded-none overflow-hidden`}
                >
                  <button
                    onClick={() => setExpandedChange(isExpanded ? null : index)}
                    className={`w-full px-4 py-3 flex items-center justify-between ${styles.bg} hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${styles.text} bg-white/50`}>
                        {change.priority}
                      </span>
                      <span className="font-medium text-stone-800">{change.section}</span>
                      <span className={`text-xs capitalize ${styles.text}`}>
                        ({change.change_type})
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white space-y-4">
                      {/* Original Text */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-red-600 uppercase tracking-wide">
                            Original (Remove)
                          </span>
                          <button
                            onClick={() => copyToClipboard(change.original_text, `orig-${index}`)}
                            className="text-xs text-stone-400 hover:text-stone-600"
                          >
                            {copied === `orig-${index}` ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-none p-3 text-sm text-red-900 font-mono whitespace-pre-wrap">
                          {change.original_text}
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-stone-400" />
                      </div>

                      {/* Revised Text */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
                            Revised (Add)
                          </span>
                          <button
                            onClick={() => copyToClipboard(change.revised_text, `rev-${index}`)}
                            className="text-xs text-stone-400 hover:text-stone-600"
                          >
                            {copied === `rev-${index}` ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-none p-3 text-sm text-emerald-900 font-mono whitespace-pre-wrap">
                          {change.revised_text}
                        </div>
                      </div>

                      {/* Rationale & Negotiation Notes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                        <div>
                          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                            Why This Matters
                          </span>
                          <p className="text-sm text-stone-700 mt-1">{change.rationale}</p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                            How to Present
                          </span>
                          <p className="text-sm text-stone-700 mt-1">{change.negotiation_note}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "document" && result.improved_document && (
          <div>
            {/* PDF Export Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-none p-4 mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-none flex items-center justify-center flex-shrink-0">
                  <FileDown className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-900 mb-1">Download Final Contract</h4>
                  <p className="text-sm text-emerald-700 mb-3">
                    Download a professional PDF ready to send to the landlord.
                    All revisions are incorporated into a final, executable contract.
                  </p>
                  <button
                    onClick={exportAsPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-none hover:bg-emerald-700 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Download Final PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-stone-500">
                Full contract with all revisions applied
              </p>
              <button
                onClick={() => downloadAsText(result.improved_document!, "improved-lease.txt")}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-stone-300 rounded-none hover:bg-stone-50"
              >
                <Download className="w-4 h-4" />
                Download Text
              </button>
            </div>
            <div className="bg-stone-50 border border-stone-200 rounded-none p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-sm text-stone-800 whitespace-pre-wrap font-mono">
                {result.improved_document}
              </pre>
            </div>
          </div>
        )}

        {activeTab === "letter" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-stone-500">
                Professional cover letter to accompany your revised contract
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(result.negotiation_cover_letter, "letter")}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-stone-300 rounded-none hover:bg-stone-50"
                >
                  {copied === "letter" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy
                </button>
                <button
                  onClick={() => downloadAsText(result.negotiation_cover_letter, "cover-letter.txt")}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-stone-300 rounded-none hover:bg-stone-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-none p-6">
              <div className="prose prose-stone prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-stone-800">
                  {result.negotiation_cover_letter}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
