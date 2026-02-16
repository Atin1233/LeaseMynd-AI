"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { ErrorMessage } from "~/components/ui/ErrorMessage";

interface AnalyzeButtonProps {
  leaseId: string;
}

export function AnalyzeButton({ leaseId }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Analysis failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="flex items-center gap-2 bg-blue-600 text-white font-medium py-2.5 px-5 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Analyze with AI
          </>
        )}
      </button>
      {error && (
        <ErrorMessage
          message={error}
          action={{
            label: "Try Again",
            onClick: handleAnalyze,
          }}
          dismissible
        />
      )}
    </div>
  );
}
