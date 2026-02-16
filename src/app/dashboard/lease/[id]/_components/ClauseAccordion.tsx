"use client";

import { useState } from "react";
import {
  ChevronDown,
  DollarSign,
  Scale,
  Settings,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { CommentSection } from "./CommentSection";

interface Clause {
  id: string;
  category: string;
  subcategory: string | null;
  clause_type: string;
  original_text: string;
  plain_english_explanation: string | null;
  risk_impact: number | null;
  is_standard: boolean;
  recommendations: string[] | null;
  page_numbers: number[] | null;
}

interface ClauseAccordionProps {
  clauses: Clause[];
  leaseId: string;
  analysisId?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Financial: <DollarSign className="w-4 h-4" />,
  "Legal & Risk": <Scale className="w-4 h-4" />,
  Operational: <Settings className="w-4 h-4" />,
  "Termination & Default": <AlertCircle className="w-4 h-4" />,
};

const CATEGORY_STYLES: Record<string, { icon: string; bg: string }> = {
  Financial: { icon: "text-emerald-600", bg: "bg-emerald-50" },
  "Legal & Risk": { icon: "text-violet-600", bg: "bg-violet-50" },
  Operational: { icon: "text-blue-600", bg: "bg-blue-50" },
  "Termination & Default": { icon: "text-red-600", bg: "bg-red-50" },
};

export function ClauseAccordion({ clauses, leaseId, analysisId }: ClauseAccordionProps) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openClauses, setOpenClauses] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  const groupedClauses = clauses.reduce(
    (acc, clause) => {
      const category = clause.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(clause);
      return acc;
    },
    {} as Record<string, Clause[]>
  );

  const toggleCategory = (category: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(category)) {
      newOpen.delete(category);
    } else {
      newOpen.add(category);
    }
    setOpenCategories(newOpen);
  };

  const toggleClause = (clauseId: string) => {
    const newOpen = new Set(openClauses);
    if (newOpen.has(clauseId)) {
      newOpen.delete(clauseId);
    } else {
      newOpen.add(clauseId);
    }
    setOpenClauses(newOpen);
  };

  const getRiskBadge = (impact: number | null) => {
    if (impact === null) return null;

    if (impact > 10) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-none bg-emerald-100 text-emerald-700 font-medium">
          Favorable
        </span>
      );
    }
    if (impact >= -10) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-none bg-stone-100 text-stone-600">
          Standard
        </span>
      );
    }
    if (impact >= -25) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-none bg-amber-100 text-amber-700 font-medium">
          Caution
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-none bg-red-100 text-red-700 font-medium">
        Risk
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(groupedClauses).map(([category, categoryClauses]) => {
        const isOpen = openCategories.has(category);
        const style = CATEGORY_STYLES[category] || { icon: "text-stone-600", bg: "bg-stone-50" };

        return (
          <div
            key={category}
            className="border border-stone-200 rounded-none overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-none ${style.bg} ${style.icon}`}>
                  {CATEGORY_ICONS[category] || <Settings className="w-4 h-4" />}
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-stone-900">{category}</h3>
                  <p className="text-xs text-stone-500">
                    {categoryClauses.length} clause
                    {categoryClauses.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="border-t border-stone-200 divide-y divide-stone-100">
                {categoryClauses.map((clause) => {
                  const isClauseOpen = openClauses.has(clause.id);

                  return (
                    <div key={clause.id} className="bg-stone-50/50">
                      <button
                        onClick={() => toggleClause(clause.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-stone-100/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-stone-800">
                            {clause.clause_type}
                          </span>
                          {getRiskBadge(clause.risk_impact)}
                          {clause.page_numbers && clause.page_numbers.length > 0 && (
                            <span className="text-xs text-stone-400">
                              p.{clause.page_numbers.join(", ")}
                            </span>
                          )}
                          {(commentCounts[clause.id] ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-0.5">
                              <MessageSquare className="w-3 h-3" />
                              {commentCounts[clause.id] ?? 0}
                            </span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-400 transition-transform ${isClauseOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isClauseOpen && (
                        <div className="px-4 pb-4 space-y-3">
                          {clause.original_text && (
                            <div>
                              <span className="text-xs text-stone-500 block mb-1.5">
                                Original Text
                              </span>
                              <p className="text-sm text-stone-600 italic bg-white border border-stone-200 p-3 rounded-none">
                                &quot;{clause.original_text}&quot;
                              </p>
                            </div>
                          )}

                          {clause.plain_english_explanation && (
                            <div>
                              <span className="text-xs text-stone-500 block mb-1.5">
                                Plain English
                              </span>
                              <p className="text-sm text-stone-700">
                                {clause.plain_english_explanation}
                              </p>
                            </div>
                          )}

                          {clause.recommendations &&
                            clause.recommendations.length > 0 && (
                              <div>
                                <span className="text-xs text-stone-500 block mb-1.5">
                                  Recommendations
                                </span>
                                <ul className="space-y-1">
                                  {clause.recommendations.map((rec, idx) => (
                                    <li
                                      key={idx}
                                      className="text-sm text-blue-700 flex items-start gap-2"
                                    >
                                      <span className="text-blue-400">•</span>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                          {/* Comments Section */}
                          <CommentSection
                            leaseId={leaseId}
                            clauseId={clause.id}
                            analysisId={analysisId}
                            onCommentCountChange={(count) =>
                              setCommentCounts((prev) => ({
                                ...prev,
                                [clause.id]: count,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
