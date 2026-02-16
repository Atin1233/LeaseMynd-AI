"use client";

import { useState, useEffect } from "react";
import {
  Share2,
  Loader2,
  Copy,
  Check,
  Lock,
  Calendar,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useToast } from "~/lib/hooks/use-toast";

interface ShareLinkRow {
  id: string;
  token: string;
  share_url: string;
  label: string | null;
  password_hash: string | null;
  expires_at: string | null;
  allow_comments: boolean;
  created_at: string;
}

interface ShareButtonProps {
  leaseId: string;
  plan?: string;
}

export function ShareButton({ leaseId, plan = "free" }: ShareButtonProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<ShareLinkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [allowComments, setAllowComments] = useState(true);
  const [label, setLabel] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [approvalsByLinkId, setApprovalsByLinkId] = useState<Record<string, string>>({});

  const isBroker = plan === "broker" || plan === "free";

  useEffect(() => {
    if (open && isBroker) loadLinks();
  }, [open, leaseId, isBroker]);

  async function loadLinks() {
    setLoading(true);
    try {
      const [linksRes, workflowsRes] = await Promise.all([
        fetch(`/api/share-links?leaseId=${leaseId}`),
        fetch(`/api/approval-workflows?leaseId=${leaseId}`),
      ]);
      const linksData = await linksRes.json();
      const workflowsData = await workflowsRes.json();
      setLinks(linksData.shareLinks ?? []);
      const map: Record<string, string> = {};
      for (const w of workflowsData.workflows ?? []) {
        if (w.share_link_id && !map[w.share_link_id]) map[w.share_link_id] = w.status;
      }
      setApprovalsByLinkId(map);
    } catch {
      setLinks([]);
      setApprovalsByLinkId({});
    } finally {
      setLoading(false);
    }
  }

  async function createLink() {
    if (!isBroker) return;
    setCreating(true);
    try {
      let expiresAt: string | undefined;
      const days = parseInt(expiresInDays, 10);
      if (!isNaN(days) && days > 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }
      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          password: password.trim() || undefined,
          expiresAt,
          label: label.trim() || undefined,
          allowComments,
        }),
      });
      const data = await res.json();
      if (data.success && data.shareLink) {
        setLinks((prev) => [{ ...data.shareLink, share_url: data.shareLink.share_url }, ...prev]);
        setPassword("");
        setExpiresInDays("");
        setLabel("");
        toast.success("Share link created", {
          description: "Copy the link and share it with your client.",
        });
      } else {
        toast.error("Failed to create link", {
          description: data.error ?? "Please try again.",
        });
      }
    } catch {
      toast.error("Failed to create link", { description: "Please try again." });
    } finally {
      setCreating(false);
    }
  }

  async function revokeLink(id: string) {
    try {
      const res = await fetch(`/api/share-links/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        toast.success("Link revoked");
      } else {
        toast.error("Failed to revoke link");
      }
    } catch {
      toast.error("Failed to revoke link");
    }
  }

  function copyUrl(url: string, id: string) {
    void navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!isBroker) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 shadow-sm hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-1"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-stone-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-stone-900">Share analysis</h2>
            <p className="mt-1 text-sm text-stone-500">
              Create a secure link for clients to view this analysis. Optional password and expiration.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="share-password" className="block text-sm font-medium text-stone-700">Password (optional)</label>
                <input
                  id="share-password"
                  type="password"
                  placeholder="Leave blank for no password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
                />
              </div>
              <div>
                <label htmlFor="share-expires" className="block text-sm font-medium text-stone-700">Expires in (days, optional)</label>
                <input
                  id="share-expires"
                  type="number"
                  min={1}
                  placeholder="e.g. 7"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
                />
              </div>
              <div>
                <label htmlFor="share-label" className="block text-sm font-medium text-stone-700">Label (optional)</label>
                <input
                  id="share-label"
                  placeholder="e.g. Client ABC"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:ring-1 focus:ring-stone-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="share-comments"
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-stone-600 focus:ring-stone-500"
                />
                <label htmlFor="share-comments" className="text-sm text-stone-700">Allow client comments</label>
              </div>
              <button
                type="button"
                onClick={createLink}
                disabled={creating}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                Create share link
              </button>

              {loading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading links…
                </div>
              ) : links.length > 0 ? (
                <div className="border-t border-stone-200 pt-4 space-y-3">
                  <p className="text-sm font-medium text-stone-700">Active links</p>
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{link.label || "Share link"}</p>
                        <p className="text-xs text-stone-500 truncate">{link.share_url}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                          {link.password_hash && <span className="flex items-center gap-0.5"><Lock className="h-3 w-3" /> Protected</span>}
                          {link.expires_at && (
                            <span className="flex items-center gap-0.5">
                              <Calendar className="h-3 w-3" /> Expires {new Date(link.expires_at).toLocaleDateString()}
                            </span>
                          )}
                          {(() => {
                            const status = approvalsByLinkId[link.id];
                            return status ? (
                              <span className={`capitalize ${status === "approved" ? "text-emerald-600" : status === "changes_requested" ? "text-amber-600" : "text-stone-500"}`}>
                                {status.replace("_", " ")}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyUrl(link.share_url, link.id)}
                        className="rounded p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-700"
                        title="Copy link"
                      >
                        {copiedId === link.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <a
                        href={link.share_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1.5 text-stone-500 hover:bg-stone-200 hover:text-stone-700"
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => revokeLink(link.id)}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Revoke link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
