"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lightbulb,
  MessageSquare,
  Send,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { RiskGauge } from "~/app/dashboard/lease/[id]/_components/RiskGauge";

interface ShareData {
  shareLink: { id: string; allow_comments: boolean; label: string | null };
  lease: {
    id: string;
    title: string;
    property_address: string | null;
    property_type: string | null;
    status: string;
    created_at: string;
    page_count: number | null;
  };
  analysis: {
    id: string;
    risk_score: number | null;
    risk_level: string | null;
    executive_summary: string | null;
    strengths: unknown;
    concerns: unknown;
    high_risk_items: unknown;
    recommendations: unknown;
    created_at: string;
  } | null;
  clauses: Array<{
    id: string;
    category: string;
    clause_type: string;
    original_text: string;
    plain_english_explanation: string | null;
    risk_impact: number | null;
    page_numbers: number[] | null;
  }>;
  branding: { logo_url: string | null; primary_color: string | null; secondary_color: string | null } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  share_link_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  user?: { full_name: string | null; email: string } | null;
  replies?: Comment[];
}

export default function ShareViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState("");
  const [submitPassword, setSubmitPassword] = useState("");
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [approval, setApproval] = useState<{
    status: string;
    response_note?: string | null;
    responded_at?: string | null;
  } | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approved" | "changes_requested" | null>(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const fetchData = useCallback(
    async (pwd: string) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (pwd) headers["x-share-password"] = pwd;
        const res = await fetch(
          `/api/share/by-token?token=${encodeURIComponent(token)}`,
          { headers }
        );
        const json = await res.json();
        if (!res.ok) {
          if (json.requiresPassword) setRequiresPassword(true);
          setError(json.error ?? "Invalid or expired link");
          setData(null);
          return;
        }
        setData(json);
        setRequiresPassword(false);
        await fetch(`/api/share/record-view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: pwd }),
        });
      } catch {
        setError("Something went wrong");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) fetchData("");
  }, [token, fetchData]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitPassword(password);
    fetchData(password);
  };

  const loadComments = useCallback(async () => {
    if (!token || !data?.lease?.id) return;
    const headers: Record<string, string> = {};
    if (submitPassword) headers["x-share-password"] = submitPassword;
    const res = await fetch(
      `/api/share/comments?token=${encodeURIComponent(token)}&leaseId=${data.lease.id}`,
      { headers }
    );
    const json = await res.json();
    if (res.ok && Array.isArray(json.comments)) setComments(json.comments);
  }, [token, data?.lease?.id, submitPassword]);

  useEffect(() => {
    if (data?.shareLink?.allow_comments && data?.lease?.id) loadComments();
  }, [data?.shareLink?.allow_comments, data?.lease?.id, loadComments]);

  const loadApproval = useCallback(async () => {
    if (!token || !data?.lease?.id) return;
    const headers: Record<string, string> = {};
    if (submitPassword) headers["x-share-password"] = submitPassword;
    const res = await fetch(
      `/api/share/approval?token=${encodeURIComponent(token)}&leaseId=${data.lease.id}`,
      { headers }
    );
    const json = await res.json();
    if (res.ok && json.approval) setApproval(json.approval);
    else setApproval(null);
  }, [token, data?.lease?.id, submitPassword]);

  useEffect(() => {
    if (data?.lease?.id && token) loadApproval();
  }, [data?.lease?.id, token, loadApproval]);

  const handleSubmitApproval = async (status: "approved" | "changes_requested") => {
    if (!data?.lease?.id) return;
    setSubmittingApproval(true);
    setApprovalAction(status);
    try {
      const res = await fetch("/api/share/approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: submitPassword,
          status,
          note: approvalNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setApproval(json.approval);
        setApprovalNote("");
      }
    } finally {
      setSubmittingApproval(false);
      setApprovalAction(null);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !data?.lease?.id) return;
    setSubmittingComment(true);
    try {
      const res = await fetch("/api/share/client-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: submitPassword,
          leaseId: data.lease.id,
          content: commentText.trim(),
          guestName: guestName.trim() || undefined,
          guestEmail: guestEmail.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCommentText("");
        loadComments();
      } else {
        setError(json.error ?? "Failed to add comment");
      }
    } catch {
      setError("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!token) return null;

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4 text-stone-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading shared analysis…</p>
        </div>
      </div>
    );
  }

  if (requiresPassword || (error && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-stone-900">Enter password</h1>
          <p className="mt-1 text-sm text-stone-500">
            This link is protected. Enter the password to view the analysis.
          </p>
          {error && !requiresPassword && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              View analysis
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-stone-600 hover:underline">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { lease, analysis, clauses, branding } = data;
  const primaryColor = branding?.primary_color ?? "#1c1917";

  return (
    <div className="min-h-screen bg-stone-50">
      <header
        className="border-b border-stone-200 bg-white px-4 py-3"
        style={branding?.primary_color ? { borderBottomColor: primaryColor } : undefined}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt="Logo" className="h-8 object-contain" />
          ) : (
            <span className="text-lg font-semibold text-stone-800">LeaseAI</span>
          )}
          <span className="text-sm text-stone-500">Shared analysis</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">{lease.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-stone-500">
            {lease.property_address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {lease.property_address}
              </span>
            )}
            {lease.property_type && (
              <span className="capitalize rounded bg-stone-100 px-2 py-0.5 text-stone-600">
                {lease.property_type}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {new Date(lease.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {lease.page_count && (
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {lease.page_count} pages
              </span>
            )}
          </div>
        </div>

        {!analysis ? (
          <div className="rounded-lg border border-stone-200 bg-white p-10 text-center text-stone-500">
            This lease has not been analyzed yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
              <div className="rounded-lg border border-stone-200 bg-white p-6">
                <h2 className="text-sm font-medium uppercase tracking-wider text-stone-500 mb-4">
                  Risk Score
                </h2>
                <RiskGauge
                  score={analysis.risk_score ?? 50}
                  level={analysis.risk_level ?? "medium"}
                />
              </div>
              <div className="lg:col-span-2 rounded-lg border border-stone-200 bg-white p-6">
                <h2 className="text-sm font-medium uppercase tracking-wider text-stone-500 mb-4">
                  Summary
                </h2>
                <p className="text-stone-700 leading-relaxed">
                  {analysis.executive_summary ?? "No summary available."}
                </p>
                <div className="mt-5 flex items-center gap-4 border-t border-stone-100 pt-5 text-xs text-stone-400">
                  <span>
                    Analyzed{" "}
                    {new Date(analysis.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
              <FindingsCard
                title="Strengths"
                icon={<CheckCircle className="h-4 w-4" />}
                items={(analysis.strengths as string[]) ?? []}
                variant="success"
              />
              <FindingsCard
                title="Concerns"
                icon={<AlertTriangle className="h-4 w-4" />}
                items={(analysis.concerns as string[]) ?? []}
                variant="warning"
              />
              <FindingsCard
                title="High Risk"
                icon={<XCircle className="h-4 w-4" />}
                items={(analysis.high_risk_items as string[]) ?? []}
                variant="danger"
              />
            </div>

            {Array.isArray(analysis.recommendations) && (analysis.recommendations as unknown[]).length > 0 && (
              <div className="mb-8 rounded-lg border border-stone-200 bg-white p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-stone-900">Recommendations</h2>
                </div>
                <ul className="space-y-2">
                  {(analysis.recommendations as string[]).map((rec, i) => (
                    <li key={i} className="text-stone-700">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {clauses.length > 0 && (
              <div className="mb-8 rounded-lg border border-stone-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-5">Clause Analysis</h2>
                <div className="space-y-4">
                  {clauses.map((c) => (
                    <div key={c.id} className="border border-stone-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-stone-800">{c.category}</span>
                        {c.risk_impact != null && (
                          <span className="text-xs text-stone-500">Impact: {c.risk_impact}</span>
                        )}
                      </div>
                      <p className="text-sm text-stone-600">{c.plain_english_explanation ?? c.original_text.slice(0, 200)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Approval (approve / request changes) */}
        <div className="rounded-lg border border-stone-200 bg-white p-6 mb-8">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            {approval?.status === "approved" ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            ) : approval?.status === "changes_requested" ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <ThumbsUp className="h-5 w-5 text-stone-500" />
            )}
            Approval
          </h2>
          {approval ? (
            <div className="space-y-2">
              <p className="text-sm font-medium capitalize text-stone-800">
                Status: {approval.status.replace("_", " ")}
              </p>
              {approval.response_note && (
                <p className="text-sm text-stone-600">{approval.response_note}</p>
              )}
              {approval.responded_at && (
                <p className="text-xs text-stone-400">
                  {new Date(approval.responded_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-stone-600">
                Approve this analysis or request changes for the broker.
              </p>
              <textarea
                placeholder="Optional note…"
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmitApproval("approved")}
                  disabled={submittingApproval}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submittingApproval && approvalAction === "approved" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitApproval("changes_requested")}
                  disabled={submittingApproval}
                  className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  {submittingApproval && approvalAction === "changes_requested" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ThumbsDown className="h-4 w-4" />
                  )}
                  Request changes
                </button>
              </div>
            </div>
          )}
        </div>

        {data.shareLink.allow_comments && (
          <div className="rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments
            </h2>
            <form onSubmit={handleAddComment} className="mb-6 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
                />
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
                />
              </div>
              <textarea
                placeholder="Add a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
                required
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="flex items-center gap-2 rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post comment
              </button>
            </form>
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="border-l-2 border-stone-200 pl-4">
                  <p className="text-sm font-medium text-stone-800">
                    {c.user?.full_name ?? c.guest_name ?? "Guest"}
                  </p>
                  <p className="text-sm text-stone-600 mt-0.5">{c.content}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                  {c.replies?.length ? (
                    <div className="mt-2 ml-4 space-y-2">
                      {c.replies.map((r) => (
                        <div key={r.id} className="text-sm">
                          <p className="font-medium text-stone-700">
                            {r.user?.full_name ?? r.guest_name ?? "Guest"}
                          </p>
                          <p className="text-stone-600">{r.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FindingsCard({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  variant: "success" | "warning" | "danger";
}) {
  const styles = {
    success: { bg: "bg-emerald-50", border: "border-emerald-200", title: "text-emerald-800" },
    warning: { bg: "bg-amber-50", border: "border-amber-200", title: "text-amber-800" },
    danger: { bg: "bg-red-50", border: "border-red-200", title: "text-red-800" },
  };
  const s = styles[variant];
  if (!items?.length) return null;
  return (
    <div className={`rounded-lg border p-6 ${s.bg} ${s.border}`}>
      <h3 className={`font-medium flex items-center gap-2 ${s.title}`}>
        {icon}
        {title}
      </h3>
      <ul className="mt-3 list-disc list-inside space-y-1 text-sm text-stone-700">
        {items.slice(0, 5).map((item, i) => (
          <li key={i}>{typeof item === "string" ? item : String(item)}</li>
        ))}
      </ul>
    </div>
  );
}
