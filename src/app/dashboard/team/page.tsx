"use client";
// @ts-nocheck - Supabase type inference issues
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "~/lib/supabase/client";
import { useToast } from "~/lib/hooks/use-toast";
import {
  Users,
  Mail,
  Loader2,
  UserPlus,
  MoreVertical,
  Shield,
  Eye,
  Trash2,
  Copy,
  Check,
  X,
  ArrowRight,
} from "lucide-react";

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface Organization {
  name: string;
  plan: string;
}

export default function TeamPage() {
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;
    setCurrentUserId(user.id);

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profile) {
      const p = profile as { role: string; organization_id?: string };
      setCurrentUserRole(p.role);
      if (p.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name, plan")
          .eq("id", p.organization_id)
          .single();
        setOrganization(org as { name: string; plan: string } | null);
      }
    }

    // Get members
    const membersRes = await fetch("/api/team/members");
    const membersData = await membersRes.json();
    setMembers(membersData.members || []);

    // Get invites
    const invitesRes = await fetch("/api/team/invite");
    const invitesData = await invitesRes.json();
    setInvites(invitesData.invites || []);

    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (data.success) {
        setInviteLink(data.invite.link);
        setInvites([data.invite, ...invites]);
        setInviteEmail("");
        toast.success("Invitation sent!", {
          description: data.message || "The team member will receive an email with the invitation link.",
        });
      } else {
        toast.error("Failed to send invite", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Failed to send invite", {
        description: "Please try again",
      });
    }

    setInviting(false);
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      const response = await fetch(`/api/team/invite?id=${inviteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setInvites(invites.filter((i) => i.id !== inviteId));
      }
    } catch (error) {
      console.error("Cancel invite error:", error);
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      const response = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (response.ok) {
        setMembers(
          members.map((m) =>
            m.id === memberId ? { ...m, role: newRole } : m
          )
        );
      }
    } catch (error) {
      console.error("Change role error:", error);
    }
    setActiveMenu(null);
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const response = await fetch(`/api/team/members?id=${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } catch (error) {
      console.error("Remove member error:", error);
    }
    setActiveMenu(null);
  }

  function copyInviteLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const canManageTeam = ["owner", "admin"].includes(currentUserRole);
  const planLimits: Record<string, number> = {
    free: 1,
    single: 1,
    team: 5,
    broker: 20,
  };
  const memberLimit = planLimits[organization?.plan || "free"] || 1;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900 mb-2">
            Team Members
          </h1>
          <p className="text-stone-600">
            Manage your team and collaborate on lease analyses
          </p>
        </div>

        {canManageTeam && members.length < memberLimit && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Usage indicator */}
      <div className="bg-gradient-to-r from-blue-50 to-stone-50 border border-stone-200 p-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold text-stone-900">
                  {members.length} of {memberLimit} team members
                </span>
                <span className="text-sm text-stone-500">
                  ({Math.round((members.length / memberLimit) * 100)}% used)
                </span>
              </div>
              <div className="w-48 bg-stone-200 h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    members.length >= memberLimit
                      ? "bg-red-500"
                      : members.length / memberLimit > 0.8
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min((members.length / memberLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          {members.length >= memberLimit && (
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Upgrade for more seats
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white border border-stone-200 rounded-none overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-stone-200">
          <h2 className="font-semibold text-stone-900">Active Members</h2>
        </div>

        <div className="divide-y divide-stone-100">
          {members.map((member) => (
            <div
              key={member.id}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-none bg-stone-100 flex items-center justify-center text-stone-600 font-medium">
                  {member.full_name?.[0]?.toUpperCase() ||
                    (member.email?.charAt(0) ?? "U").toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-stone-900">
                    {member.full_name || member.email}
                  </p>
                  <p className="text-sm text-stone-500">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold ${
                      member.role === "owner"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : member.role === "admin"
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : member.role === "viewer"
                            ? "bg-stone-100 text-stone-700 border border-stone-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {member.role === "owner" && <Shield className="w-3 h-3" />}
                    {member.role === "admin" && <Shield className="w-3 h-3" />}
                    {member.role === "viewer" && <Eye className="w-3 h-3" />}
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  {member.role === "owner" && (
                    <span className="text-xs text-stone-400">Full access</span>
                  )}
                  {member.role === "admin" && (
                    <span className="text-xs text-stone-400">Manage team</span>
                  )}
                  {member.role === "member" && (
                    <span className="text-xs text-stone-400">Edit & comment</span>
                  )}
                  {member.role === "viewer" && (
                    <span className="text-xs text-stone-400">View only</span>
                  )}
                </div>

                {canManageTeam &&
                  member.id !== currentUserId &&
                  member.role !== "owner" && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenu(
                            activeMenu === member.id ? null : member.id
                          )
                        }
                        className="p-1.5 hover:bg-stone-100 rounded-none transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-stone-500" />
                      </button>

                      {activeMenu === member.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-stone-200 rounded-none shadow-lg py-1 z-10">
                          <p className="px-3 py-1.5 text-xs text-stone-500 uppercase tracking-wide">
                            Change Role
                          </p>
                          <button
                            onClick={() =>
                              handleChangeRole(member.id, "admin")
                            }
                            className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4 text-blue-600" />
                            Admin
                          </button>
                          <button
                            onClick={() =>
                              handleChangeRole(member.id, "member")
                            }
                            className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
                          >
                            Member
                          </button>
                          <button
                            onClick={() =>
                              handleChangeRole(member.id, "viewer")
                            }
                            className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4 text-stone-500" />
                            Viewer
                          </button>
                          <hr className="my-1 border-stone-100" />
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-none overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="font-semibold text-stone-900">Pending Invites</h2>
          </div>

          <div className="divide-y divide-stone-100">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-none bg-amber-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{invite.email}</p>
                    <p className="text-sm text-stone-500">
                      Invited as {invite.role} • Expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {canManageTeam && (
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-none transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-none max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-stone-900 mb-4">
              Invite Team Member
            </h3>

            {inviteLink ? (
              <div>
                <p className="text-stone-600 mb-4">
                  Share this link with your team member:
                </p>
                <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-none mb-4">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-stone-700 outline-none"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="p-2 hover:bg-stone-200 rounded-none transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-stone-500" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteLink(null);
                  }}
                  className="w-full py-2.5 bg-stone-900 text-white rounded-none hover:bg-stone-800 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member - Can analyze leases</option>
                    <option value="admin">Admin - Can manage team</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-none hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-none hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Send Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

