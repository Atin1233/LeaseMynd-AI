"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "~/lib/hooks/use-toast";

interface ExportPdfButtonProps {
  leaseId: string;
}

export function ExportPdfButton({ leaseId }: ExportPdfButtonProps) {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);

    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId }),
      });

      const data = await response.json();

      if (data.success && data.html) {
        // Open new window with HTML content for printing
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();

          // Wait for content to load, then trigger print
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        } else {
          // Fallback: download as HTML
          const blob = new Blob([data.html], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename.replace(".pdf", ".html");
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        toast.success("PDF generated successfully", {
          description: "The PDF is ready for download",
        });
      } else {
        toast.error("Failed to generate PDF", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to generate PDF", {
        description: "Please try again",
      });
    }

    setExporting(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 rounded-none hover:bg-stone-50 transition-colors disabled:opacity-50"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Export PDF
    </button>
  );
}

