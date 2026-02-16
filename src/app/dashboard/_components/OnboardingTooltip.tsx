"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface OnboardingTooltipProps {
  totalLeases: number;
  analyzedLeases: number;
}

// Aligned to PRD Section 4: Upload, Analyze/review, Export, Compare (optional)
const checklistItems = [
  { id: "upload", label: "Upload your first lease", href: "/dashboard/upload", done: (t: number) => t >= 1, required: true },
  { id: "analyze", label: "Analyze and review results", href: "/dashboard/library", done: (_t: number, a: number) => a >= 1, required: true },
  { id: "export", label: "Export a PDF report", href: "/dashboard/library", done: (_t: number, a: number) => a >= 1, required: true },
  { id: "portfolio", label: "Compare leases in Portfolio (optional)", href: "/dashboard/portfolio", done: (t: number) => t >= 2, required: false },
] as const;

export function OnboardingTooltip({ totalLeases, analyzedLeases }: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("onboarding-checklist-dismissed");
    const allDone = totalLeases >= 1 && analyzedLeases >= 1;
    if (!dismissed && !allDone) {
      setIsVisible(true);
    } else if (dismissed) {
      setIsDismissed(true);
    } else {
      setIsVisible(true); // Show "all set" state
    }
  }, [totalLeases, analyzedLeases]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("onboarding-checklist-dismissed", "true");
  };

  if (!isVisible || isDismissed) return null;

  const requiredItems = checklistItems.filter((c) => c.required);
  const allDone = requiredItems.every((c) => c.done(totalLeases, analyzedLeases));
  const completedCount = requiredItems.filter((c) => c.done(totalLeases, analyzedLeases)).length;

  return (
    <div className="bg-stone-50 border border-stone-200 p-6 mb-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 bg-stone-200 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-stone-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-stone-900 mb-1">
              Getting Started
            </h3>
            <p className="text-sm text-stone-500 mb-4">
              {allDone
                ? "You're all set! Explore the Library or Help guide to learn more."
                : `${completedCount} of ${requiredItems.length} complete`}
            </p>
            <ul className="space-y-2">
              {checklistItems.map((item) => {
                const done = item.done(totalLeases, analyzedLeases);
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-300 flex-shrink-0" aria-hidden />
                    )}
                    <Link
                      href={item.href}
                      className={`text-sm font-medium ${
                        done ? "text-stone-500 line-through" : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      {item.label}
                    </Link>
                    {!done && (item.id === "upload" || item.id === "portfolio") && (
                      <ArrowRight className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>
            {allDone && (
              <div className="mt-4 flex gap-3">
                <Link
                  href="/dashboard/library"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Open Library
                </Link>
                <Link
                  href="/dashboard/help"
                  className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-700"
                >
                  Help Guide
                </Link>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
