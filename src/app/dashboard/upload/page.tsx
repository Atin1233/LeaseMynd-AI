"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { ErrorMessage } from "~/components/ui/ErrorMessage";

type UploadState = "idle" | "uploading" | "processing" | "analyzing" | "complete" | "error";
type UploadMode = "single" | "batch";
const MAX_BATCH_FILES = 50;

const PROPERTY_TYPES = [
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "industrial", label: "Industrial" },
  { value: "warehouse", label: "Warehouse" },
  { value: "medical", label: "Medical" },
  { value: "mixed", label: "Mixed Use" },
  { value: "other", label: "Other" },
];

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [mode, setMode] = useState<UploadMode>("single");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [batchState, setBatchState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [batchDueDiligence, setBatchDueDiligence] = useState(false);
  const [batchResults, setBatchResults] = useState<{ id: string; title: string; status: string; error?: string }[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "application/pdf" ||
        droppedFile.type === "application/msword" ||
        droppedFile.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        setFile(droppedFile);
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        setError("Please upload a PDF or Word document.");
      }
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setError(null);
    setUploadState("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      if (propertyAddress) formData.append("propertyAddress", propertyAddress);
      if (propertyType) formData.append("propertyType", propertyType);

      const uploadResponse = await fetch("/api/upload-lease", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      setLeaseId(uploadData.lease.id);
      setUploadState("processing");

      setUploadState("analyzing");
      const analyzeResponse = await fetch("/api/analyze-lease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: uploadData.lease.id, forceReanalyze: true }),
      });

      if (!analyzeResponse.ok) {
        let errorMessage = "Analysis failed";
        // Read response body once as text, then try to parse as JSON
        const responseText = await analyzeResponse.text();
        console.error("Analysis failed with status:", analyzeResponse.status, "Response:", responseText);
        try {
          const data = JSON.parse(responseText);
          errorMessage = data.error || data.details || data.message || "Analysis failed";
          
          // Check for rate limit errors and provide clear guidance
          if (errorMessage.toLowerCase().includes("rate limit") || 
              errorMessage.toLowerCase().includes("temporarily busy") ||
              errorMessage.toLowerCase().includes("quota")) {
            errorMessage = "⏳ Rate limit reached. Please wait 2-3 minutes and try again. (Google AI free tier: 15 requests/minute)";
          }
        } catch {
          // Response wasn't valid JSON
          errorMessage = responseText || "Analysis failed";
        }
        throw new Error(errorMessage);
      }

      setUploadState("complete");

      setTimeout(() => {
        router.push(`/dashboard/lease/${uploadData.lease.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUploadState("error");
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setPropertyAddress("");
    setPropertyType("");
    setUploadState("idle");
    setError(null);
    setLeaseId(null);
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const valid = files.filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type === "application/msword" ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    setBatchFiles((prev) => [...prev, ...valid].slice(0, MAX_BATCH_FILES));
    e.target.value = "";
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFiles.length === 0) return;
    setBatchState("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("dueDiligence", batchDueDiligence ? "true" : "false");
      batchFiles.forEach((f) => formData.append("files", f));
      batchFiles.forEach((f, i) => formData.append(`titles[${i}]`, f.name.replace(/\.[^/.]+$/, "")));
      const res = await fetch("/api/upload-lease/batch", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Batch upload failed");
      setBatchResults(data.results ?? []);
      setBatchState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch upload failed");
      setBatchState("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-stone-900 heading-font">New Analysis</h1>
        <p className="text-stone-500 mt-1">
          Upload a commercial lease document for AI-powered analysis.
        </p>
        <div className="flex gap-2 mt-4 border-b border-stone-200">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              mode === "single" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500"
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              mode === "batch" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-500"
            }`}
          >
            Batch (up to {MAX_BATCH_FILES})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-none border border-stone-200 p-8">
        {mode === "batch" ? (
          batchState === "done" || batchState === "error" ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-900">
                {batchState === "done" ? "Batch upload complete" : "Batch upload had errors"}
              </h2>
              {batchResults.length > 0 && (
                <ul className="text-sm space-y-1 max-h-60 overflow-y-auto">
                  {batchResults.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      {r.status === "error" ? (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                      <span className="truncate">{r.title}</span>
                      <span className="text-stone-500">{r.status}</span>
                      {r.error && <span className="text-red-500 text-xs">{r.error}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} dismissible />}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBatchState("idle");
                    setBatchFiles([]);
                    setBatchResults([]);
                    setError(null);
                  }}
                  className="rounded-none border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Upload more
                </button>
                <Link
                  href="/dashboard/portfolio"
                  className="rounded-none bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
                >
                  View portfolio
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleBatchSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Select files (PDF, DOC, DOCX — max {MAX_BATCH_FILES})
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleBatchFileChange}
                  className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:bg-stone-100 file:text-stone-700"
                />
                {batchFiles.length > 0 && (
                  <ul className="mt-2 text-sm text-stone-600 space-y-1 max-h-40 overflow-y-auto">
                    {batchFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setBatchFiles((prev) => prev.filter((_, j) => j !== i))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-stone-500 mt-1">
                  {batchFiles.length} file(s) selected. Leases will be uploaded and ready for analysis.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="batchDueDiligence"
                  checked={batchDueDiligence}
                  onChange={(e) => setBatchDueDiligence(e.target.checked)}
                  className="rounded border-stone-300"
                />
                <label htmlFor="batchDueDiligence" className="text-sm text-stone-700">
                  Due diligence mode (upload only; analyze from Portfolio)
                </label>
              </div>
              {error && (
                <ErrorMessage message={error} onDismiss={() => setError(null)} dismissible />
              )}
              <button
                type="submit"
                disabled={batchFiles.length === 0 || batchState === "uploading"}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {batchState === "uploading" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {batchFiles.length} file(s)
                  </>
                )}
              </button>
            </form>
          )
        ) : uploadState === "complete" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-none flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 mb-2 heading-font">
              Analysis Complete
            </h2>
            <p className="text-stone-500 mb-4">
              Redirecting to your results...
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
          </div>
        ) : uploadState !== "idle" ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-none flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-stone-900 mb-2 heading-font">
              {uploadState === "uploading" && "Uploading document..."}
              {uploadState === "processing" && "Processing document..."}
              {uploadState === "analyzing" && "Analyzing with AI..."}
              {uploadState === "error" && "Error occurred"}
            </h2>
            <p className="text-stone-500">
              {uploadState === "uploading" && "Please wait while we upload your file."}
              {uploadState === "processing" && "Extracting text from your document."}
              {uploadState === "analyzing" && "This typically takes 1-2 minutes."}
              {uploadState === "error" && error}
            </p>

            {uploadState === "error" && (
              <button
                onClick={resetForm}
                className="mt-6 text-blue-600 hover:text-blue-700 font-medium"
              >
                Try again
              </button>
            )}

            {uploadState !== "error" && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <StepIndicator
                  step={1}
                  label="Upload"
                  active={uploadState === "uploading"}
                  complete={["processing", "analyzing", "complete"].includes(uploadState)}
                />
                <div className="w-8 h-px bg-stone-200" />
                <StepIndicator
                  step={2}
                  label="Process"
                  active={uploadState === "processing"}
                  complete={["analyzing", "complete"].includes(uploadState)}
                />
                <div className="w-8 h-px bg-stone-200" />
                <StepIndicator
                  step={3}
                  label="Analyze"
                  active={uploadState === "analyzing"}
                  complete={false}
                />
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-none p-10 text-center transition-all ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : file
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              {file ? (
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-none flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-stone-900 font-medium">{file.name}</p>
                    <p className="text-sm text-stone-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-stone-100 rounded-none transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-400" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-stone-100 rounded-none flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-7 h-7 text-stone-400" />
                  </div>
                  <p className="text-stone-900 font-medium mb-1">
                    Drop your document here
                  </p>
                  <p className="text-sm text-stone-500">
                    or click to browse (PDF, DOC, DOCX)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., 123 Main St Office Lease"
                required
              />
            </div>

            {/* Property Address */}
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-medium text-stone-700 mb-2">
                Property Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  id="propertyAddress"
                  type="text"
                  value={propertyAddress}
                  onChange={(e) => setPropertyAddress(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-none py-3 pl-11 pr-4 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="123 Main St, Suite 500, New York, NY"
                />
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label htmlFor="propertyType" className="block text-sm font-medium text-stone-700 mb-2">
                Property Type
              </label>
              <select
                id="propertyType"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-none py-3 px-4 text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select type (optional)</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <ErrorMessage
                message={error}
                action={undefined}
                dismissible
                onDismiss={() => setError(null)}
              />
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!file || !title}
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload and Analyze
            </button>

            <p className="text-xs text-stone-500 text-center">
              Your document is securely processed. Analysis typically takes 1-2 minutes.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  active,
  complete,
}: {
  step: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-8 h-8 rounded-none flex items-center justify-center text-sm font-medium transition-colors ${
          complete
            ? "bg-emerald-600 text-white"
            : active
              ? "bg-blue-600 text-white"
              : "bg-stone-100 text-stone-400"
        }`}
      >
        {complete ? <CheckCircle className="w-4 h-4" /> : step}
      </div>
      <span className={`text-xs ${active || complete ? "text-stone-900" : "text-stone-400"}`}>
        {label}
      </span>
    </div>
  );
}
