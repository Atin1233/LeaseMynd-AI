"use client";

import { useEffect, useState } from "react";
import { FileText, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "~/components/ui/Skeleton";

interface Activity {
  id: string;
  type: "analysis" | "upload";
  timestamp: string;
  user: { id: string; name: string; email: string };
  lease: { id: string; title: string; address?: string };
  metadata?: { risk_score?: number };
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const response = await fetch("/api/activity?limit=10");
      if (!response.ok) {
        // Don't throw, just log and show empty state
        console.warn("Activity feed returned non-OK status:", response.status);
        setActivities([]);
        return;
      }
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (error) {
      // Silently handle network errors - this is a non-critical feature
      // Common during dev server restarts or initial page load
      console.warn("Activity feed unavailable:", error instanceof Error ? error.message : "Network error");
      setActivities([]);
    } finally {
      setLoading(false);
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

  function getRiskColor(score?: number): string {
    if (!score) return "text-stone-500";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  }

  if (loading) {
    return (
      <div className="bg-white border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y divide-stone-100">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-8 h-8" variant="circular" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" variant="text" />
                  <Skeleton className="h-3 w-32" variant="text" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-stone-200 p-6">
        <h3 className="font-semibold text-stone-900 mb-4">Recent Activity</h3>
        <p className="text-sm text-stone-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200">
        <h3 className="font-semibold text-stone-900">Recent Activity</h3>
      </div>

      <div className="divide-y divide-stone-100">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/dashboard/lease/${activity.lease.id}`}
            className="block px-6 py-4 hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 flex items-center justify-center flex-shrink-0 transition-colors ${
                  activity.type === "analysis"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {activity.type === "analysis" ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-stone-900">
                      <span className="font-medium">{activity.user.name}</span>{" "}
                      {activity.type === "analysis"
                        ? "analyzed"
                        : "uploaded"}{" "}
                      <span className="font-medium">{activity.lease.title}</span>
                    </p>
                    {activity.lease.address && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {activity.lease.address}
                      </p>
                    )}
                    {activity.type === "analysis" &&
                      activity.metadata?.risk_score !== undefined && (
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs font-medium ${getRiskColor(
                              activity.metadata.risk_score
                            )}`}
                          >
                            Risk Score: {activity.metadata.risk_score}/100
                          </span>
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-400 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {activities.length >= 10 && (
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all activity →
          </Link>
        </div>
      )}
    </div>
  );
}
