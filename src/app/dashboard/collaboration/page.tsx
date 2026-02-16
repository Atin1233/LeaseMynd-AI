"use client";
import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase/client";
import Link from "next/link";
import {
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
  MessageCircle,
  Activity,
  Filter,
  RefreshCw,
  BarChart3,
  Calendar,
} from "lucide-react";
import { Skeleton, SkeletonCard } from "~/components/ui/Skeleton";
import { useToast } from "~/lib/hooks/use-toast";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  lease: {
    id: string;
    title: string;
  };
  clause?: {
    id: string;
    clause_type: string;
  };
}

interface Activity {
  id: string;
  type: "analysis" | "upload" | "comment";
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  lease: {
    id: string;
    title: string;
    address?: string;
  };
  metadata?: {
    risk_score?: number;
    comment_count?: number;
  };
}

interface TeamStats {
  totalMembers: number;
  totalLeases: number;
  totalComments: number;
  recentActivity: number;
}

export default function CollaborationPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [organization, setOrganization] = useState<{ name: string } | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "analysis" | "upload" | "comment">("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get profile and organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      const orgId = (profile as { organization_id?: string } | null)?.organization_id;
      if (orgId) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", orgId)
          .maybeSingle();

        setOrganization(org ?? null);

        await loadTeamStats(orgId);
        await loadRecentComments(orgId);
        await loadRecentActivity(orgId);
      }
    } catch (error) {
      console.error("Failed to load collaboration data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamStats(orgId: string) {
    try {
      const supabase = createClient();

      // Get member count
      const { count: memberCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);

      // Get lease count and lease IDs
      const { data: leases, count: leaseCount } = await supabase
        .from("leases")
        .select("id", { count: "exact" })
        .eq("organization_id", orgId);

      // Get comment count
      let commentCount = 0;
      if (leases && leases.length > 0) {
        const leaseIds = (leases as { id: string }[]).map((l) => l.id);
        const { count } = await supabase
          .from("lease_comments")
          .select("*", { count: "exact", head: true })
          .in("lease_id", leaseIds);
        commentCount = count || 0;
      }

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let activityCount = 0;
      if (leases && leases.length > 0) {
        const leaseIds = (leases as { id: string }[]).map((l) => l.id);
        const { count } = await supabase
          .from("lease_analyses")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString())
          .in("lease_id", leaseIds);
        activityCount = count || 0;
      }

      setStats({
        totalMembers: memberCount || 0,
        totalLeases: leaseCount || 0,
        totalComments: commentCount || 0,
        recentActivity: activityCount || 0,
      });
    } catch (error) {
      console.error("Failed to load team stats:", error);
    }
  }

  async function loadRecentComments(orgId: string) {
    try {
      const supabase = createClient();

      // Get recent comments from leases in this org
      const { data: leases } = await supabase
        .from("leases")
        .select("id")
        .eq("organization_id", orgId);

      if (!leases || leases.length === 0) {
        setComments([]);
        return;
      }

      const leaseIds = (leases as { id: string }[]).map((l) => l.id);

      const { data: commentsData } = await supabase
        .from("lease_comments")
        .select(
          `
          id,
          content,
          created_at,
          user:profiles!lease_comments_user_id_fkey (
            id,
            email,
            full_name
          ),
          lease:leases!lease_comments_lease_id_fkey (
            id,
            title
          ),
          clause:clause_extractions!lease_comments_clause_id_fkey (
            id,
            clause_type
          )
        `
        )
        .in("lease_id", leaseIds)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (commentsData) {
        setComments(commentsData as any);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  }

  async function loadRecentActivity(orgId: string) {
    try {
      const response = await fetch(`/api/activity?limit=30`);
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Failed to load activity:", error);
      toast.error("Failed to load activity", {
        description: "Please try refreshing the page",
      });
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      const orgId = (profile as { organization_id?: string } | null)?.organization_id;
      if (orgId) {
        await Promise.all([
          loadTeamStats(orgId),
          loadRecentComments(orgId),
          loadRecentActivity(orgId),
        ]);
        toast.success("Data refreshed");
      }
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }

  const filteredActivities = activityFilter === "all" 
    ? activities 
    : activities.filter(a => a.type === activityFilter);

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

  function getUserInitials(user: { full_name: string | null; email: string }): string {
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
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" variant="text" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900 mb-2 heading-font">
              Team Collaboration
            </h1>
            <p className="text-stone-500">
              {organization
                ? `Collaboration hub for ${organization.name}`
                : "View team activity, comments, and shared documents"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            label="Team Members"
            value={stats.totalMembers}
            icon={<Users className="w-5 h-5" />}
            color="text-blue-600"
          />
          <StatCard
            label="Total Leases"
            value={stats.totalLeases}
            icon={<FileText className="w-5 h-5" />}
            color="text-emerald-600"
          />
          <StatCard
            label="Comments"
            value={stats.totalComments}
            icon={<MessageSquare className="w-5 h-5" />}
            color="text-violet-600"
          />
          <StatCard
            label="This Week"
            value={stats.recentActivity}
            icon={<Activity className="w-5 h-5" />}
            color="text-amber-600"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Comments - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Comments */}
          <div className="bg-white border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 heading-font">
                  Recent Comments
                </h2>
                <Link
                  href="/dashboard"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {comments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 text-sm">
                  No comments yet. Start collaborating by commenting on lease clauses!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {comments.map((comment) => (
                  <Link
                    key={comment.id}
                    href={`/dashboard/lease/${comment.lease.id}`}
                    className="block px-6 py-4 hover:bg-stone-50 transition-colors"
                  >
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
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-stone-700 line-clamp-2 mb-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <FileText className="w-3 h-3" />
                          <span className="font-medium">{comment.lease.title}</span>
                          {comment.clause && (
                            <>
                              <span>•</span>
                              <span>{comment.clause.clause_type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-stone-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-stone-900 heading-font">
                  Team Activity
                </h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-stone-400" />
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value as any)}
                    className="text-xs border border-stone-200 px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Activity</option>
                    <option value="analysis">Analyses</option>
                    <option value="upload">Uploads</option>
                    <option value="comment">Comments</option>
                  </select>
                </div>
              </div>
              {filteredActivities.length > 0 && (
                <div className="text-xs text-stone-500">
                  Showing {filteredActivities.length} of {activities.length} activities
                </div>
              )}
            </div>

            {filteredActivities.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Activity className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 text-sm">
                  {activityFilter === "all" 
                    ? "No recent activity" 
                    : `No ${activityFilter} activity found`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredActivities.map((activity, index) => (
                  <Link
                    key={activity.id}
                    href={`/dashboard/lease/${activity.lease.id}`}
                    className="block px-6 py-4 hover:bg-stone-50 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                          activity.type === "analysis"
                            ? "bg-blue-100 text-blue-600"
                            : activity.type === "comment"
                              ? "bg-violet-100 text-violet-600"
                              : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {activity.type === "analysis" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : activity.type === "comment" ? (
                          <MessageSquare className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-900">
                          <span className="font-medium">{activity.user.name}</span>{" "}
                          {activity.type === "analysis"
                            ? "analyzed"
                            : activity.type === "comment"
                              ? "commented on"
                              : "uploaded"}{" "}
                          <span className="font-medium">{activity.lease.title}</span>
                        </p>
                        {activity.lease.address && (
                          <p className="text-xs text-stone-500 mt-0.5">
                            {activity.lease.address}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span className="text-xs text-stone-400">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                          {activity.metadata?.risk_score && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span className="text-xs text-stone-500">
                                Risk: {activity.metadata.risk_score}/100
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Analytics - 1 column */}
        <div className="space-y-6">
          {/* Team Analytics Summary */}
          {stats && (
            <div className="bg-gradient-to-br from-blue-50 to-stone-50 border border-stone-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-stone-900">Team Analytics</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-600">Leases per Member</span>
                    <span className="text-xs font-semibold text-stone-900">
                      {stats.totalMembers > 0 
                        ? (stats.totalLeases / stats.totalMembers).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          stats.totalMembers > 0
                            ? ((stats.totalLeases / stats.totalMembers) / 10) * 100
                            : 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-stone-600">Comments per Lease</span>
                    <span className="text-xs font-semibold text-stone-900">
                      {stats.totalLeases > 0
                        ? (stats.totalComments / stats.totalLeases).toFixed(1)
                        : "0"}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 overflow-hidden">
                    <div
                      className="h-full bg-violet-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          stats.totalLeases > 0
                            ? ((stats.totalComments / stats.totalLeases) / 5) * 100
                            : 0,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-600">Activity This Week</span>
                    <span className="text-sm font-semibold text-amber-600">
                      {stats.recentActivity} analyses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-stone-200 p-6">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/upload"
                className="flex items-center gap-3 p-3 border border-stone-200 hover:bg-stone-50 hover:border-blue-300 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-900">Upload New Lease</div>
                  <div className="text-xs text-stone-500">Start a new analysis</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600 transition-colors" />
              </Link>
              <Link
                href="/dashboard/team"
                className="flex items-center gap-3 p-3 border border-stone-200 hover:bg-stone-50 hover:border-emerald-300 transition-all group"
              >
                <div className="w-10 h-10 bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-900">Manage Team</div>
                  <div className="text-xs text-stone-500">Invite members, set roles</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition-colors" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 p-3 border border-stone-200 hover:bg-stone-50 hover:border-violet-300 transition-all group"
              >
                <div className="w-10 h-10 bg-violet-100 group-hover:bg-violet-200 flex items-center justify-center transition-colors">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-900">View All Leases</div>
                  <div className="text-xs text-stone-500">Browse your lease library</div>
                </div>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-violet-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white border border-stone-200 p-4 sm:p-5 card-hover group">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs sm:text-sm font-medium text-stone-500">{label}</span>
        <span className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`}>
          {icon}
        </span>
      </div>
      <div className={`text-2xl sm:text-3xl font-semibold ${color} mb-1`}>{value}</div>
      {value > 0 && (
        <div className="text-xs text-stone-400">
          {value === 1 ? "item" : "items"}
        </div>
      )}
    </div>
  );
}
