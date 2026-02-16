"use client";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "~/lib/supabase/client";
import { useToast } from "~/lib/hooks/use-toast";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  user: User;
  replies?: Comment[];
}

interface CommentSectionProps {
  leaseId: string;
  clauseId?: string;
  analysisId?: string;
  onCommentCountChange?: (count: number) => void;
}

export function CommentSection({
  leaseId,
  clauseId,
  analysisId,
  onCommentCountChange,
}: CommentSectionProps) {
  const toast = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [editContent, setEditContent] = useState<Record<string, string>>({});

  useEffect(() => {
    loadComments();
    loadCurrentUser();
  }, [leaseId, clauseId, analysisId]);

  async function loadCurrentUser() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }

  async function loadComments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ leaseId });
      if (clauseId) params.append("clauseId", clauseId);
      if (analysisId) params.append("analysisId", analysisId);

      const response = await fetch(`/api/comments?${params}`);
      const data = await response.json();
      setComments(data.comments || []);
      onCommentCountChange?.(data.comments?.length || 0);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          clauseId,
          analysisId,
          content: newComment,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post comment");
      }

      setNewComment("");
      await loadComments();
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Comment submission error:", error);
      toast.error("Failed to post comment", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    const content = replyContent[parentId]?.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          clauseId,
          analysisId,
          content,
          parentCommentId: parentId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post reply");
      }

      setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
      setReplyingTo(null);
      await loadComments();
      toast.success("Reply posted successfully");
    } catch (error) {
      console.error("Reply submission error:", error);
      toast.error("Failed to post reply", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(commentId: string) {
    const content = editContent[commentId]?.trim();
    if (!content || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update comment");
      }

      setEditContent((prev) => ({ ...prev, [commentId]: "" }));
      setEditingId(null);
      await loadComments();
      toast.success("Comment updated successfully");
    } catch (error) {
      console.error("Comment update error:", error);
      toast.error("Failed to update comment", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete comment");
      }

      await loadComments();
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Comment delete error:", error);
      toast.error("Failed to delete comment", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    }
  }

  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  }

  function getUserInitials(user: User): string {
    if (user.full_name) {
      const names = user.full_name.split(" ");
      return names
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return (user.email?.charAt(0) ?? "U").toUpperCase();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="border-t border-stone-200 pt-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-stone-500" />
        <h3 className="text-sm font-semibold text-stone-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="w-full px-4 py-2.5 border border-stone-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Post
              </>
            )}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-sm text-stone-500 text-center py-6">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              editingId={editingId}
              activeMenu={activeMenu}
              replyContent={replyContent[comment.id] || ""}
              editContent={editContent[comment.id] || comment.content}
              onReplyClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              onEditClick={() => {
                setEditingId(editingId === comment.id ? null : comment.id);
                setEditContent((prev) => ({ ...prev, [comment.id]: comment.content }));
              }}
              onDeleteClick={() => handleDelete(comment.id)}
              onMenuToggle={(id) => setActiveMenu(activeMenu === id ? null : id)}
              onReplyChange={(content) =>
                setReplyContent((prev) => ({ ...prev, [comment.id]: content }))
              }
              onEditChange={(content) =>
                setEditContent((prev) => ({ ...prev, [comment.id]: content }))
              }
              onReplySubmit={() => handleReply(comment.id)}
              onEditSubmit={() => handleEdit(comment.id)}
              onCancel={() => {
                setReplyingTo(null);
                setEditingId(null);
                setReplyContent((prev) => ({ ...prev, [comment.id]: "" }));
                setEditContent((prev) => ({ ...prev, [comment.id]: comment.content }));
              }}
              formatTimeAgo={formatTimeAgo}
              getUserInitials={getUserInitials}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string | null;
  replyingTo: string | null;
  editingId: string | null;
  activeMenu: string | null;
  replyContent: string;
  editContent: string;
  onReplyClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onMenuToggle: (id: string) => void;
  onReplyChange: (content: string) => void;
  onEditChange: (content: string) => void;
  onReplySubmit: () => void;
  onEditSubmit: () => void;
  onCancel: () => void;
  formatTimeAgo: (timestamp: string) => string;
  getUserInitials: (user: User) => string;
  submitting: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  replyingTo,
  editingId,
  activeMenu,
  replyContent,
  editContent,
  onReplyClick,
  onEditClick,
  onDeleteClick,
  onMenuToggle,
  onReplyChange,
  onEditChange,
  onReplySubmit,
  onEditSubmit,
  onCancel,
  formatTimeAgo,
  getUserInitials,
  submitting,
}: CommentItemProps) {
  const isOwner = comment.user_id === currentUserId;
  const isEditing = editingId === comment.id;
  const isReplying = replyingTo === comment.id;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600 flex-shrink-0">
          {getUserInitials(comment.user)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <span className="text-sm font-medium text-stone-900">
                {comment.user.full_name || comment.user.email}
              </span>
              <span className="text-xs text-stone-500 ml-2">
                {formatTimeAgo(comment.created_at)}
                {comment.updated_at && comment.updated_at !== comment.created_at && " (edited)"}
              </span>
            </div>
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => onMenuToggle(comment.id)}
                  className="p-1 hover:bg-stone-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-stone-400" />
                </button>
                {activeMenu === comment.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        onEditClick();
                        onMenuToggle(comment.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDeleteClick();
                        onMenuToggle(comment.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => onEditChange(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={onEditSubmit}
                  disabled={!editContent.trim() || submitting}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={onCancel}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{comment.content}</p>
              <button
                onClick={onReplyClick}
                className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1 mt-1"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-11 space-y-2">
          <textarea
            value={replyContent}
            onChange={(e) => onReplyChange(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full px-3 py-2 border border-stone-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onReplySubmit}
              disabled={!replyContent.trim() || submitting}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Reply
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-stone-100 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-6 h-6 bg-stone-100 flex items-center justify-center text-xs font-medium text-stone-600 flex-shrink-0">
                {getUserInitials(reply.user)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-xs font-medium text-stone-900">
                      {reply.user.full_name || reply.user.email}
                    </span>
                    <span className="text-xs text-stone-500 ml-2">
                      {formatTimeAgo(reply.created_at)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-700 whitespace-pre-wrap">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
