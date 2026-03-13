// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

/**
 * Activity Feed API
 * GET /api/activity - Get recent team activity
 */

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    // @ts-ignore - Supabase type inference issue
    if (!profile?.organization_id) {
      return NextResponse.json({ activities: [] });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get recent lease analyses (join leases to filter by org)
    const { data: analyses } = await supabase
      .from("lease_analyses")
      .select("id, lease_id, risk_score, created_at")
      .order("created_at", { ascending: false })
      .limit(limit * 2);

    // @ts-ignore - Supabase type inference issue
    // @ts-ignore - Supabase type inference issue
    const leaseIds = [...new Set((analyses || []).map((a) => a.lease_id))];
    const { data: leasesForAnalyses } = await supabase
      .from("leases")
      .select("id, title, property_address")
      .in("id", leaseIds)
      // @ts-ignore - Supabase type inference issue
      .eq("organization_id", profile.organization_id);

    // @ts-ignore - Supabase type inference issue
    const leaseMap = new Map((leasesForAnalyses || []).map((l) => [l.id, l]));

    // Get recent lease uploads
    const { data: uploads } = await supabase
      .from("leases")
      .select("id, title, property_address, created_at")
      // @ts-ignore - Supabase type inference issue
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    const activities: Array<{
      id: string;
      type: "analysis" | "upload";
      timestamp: string;
      user: { id: string; name: string; email: string };
      lease: { id: string; title: string; address?: string };
      metadata?: { risk_score?: number };
    }> = [];

    const systemUser = { id: "", name: "Team", email: "" };

    for (const a of analyses || []) {
      // @ts-ignore - Supabase type inference issue
      const lease = leaseMap.get(a.lease_id);
      if (!lease) continue;
      activities.push({
        // @ts-ignore - Supabase type inference issue
        id: `analysis-${a.id}`,
        type: "analysis",
        // @ts-ignore - Supabase type inference issue
        timestamp: a.created_at,
        user: systemUser,
        // @ts-ignore - Supabase type inference issue
        lease: { id: lease.id, title: lease.title, address: lease.property_address ?? undefined },
        // @ts-ignore - Supabase type inference issue
        metadata: { risk_score: a.risk_score ?? undefined },
      });
    }

    for (const u of uploads || []) {
      activities.push({
        // @ts-expect-error - Supabase type inference issue
        id: `upload-${u.id}`,
        type: "upload",
        // @ts-expect-error - Supabase type inference issue
        timestamp: u.created_at,
        user: systemUser,
        // @ts-expect-error - Supabase type inference issue
        lease: { id: u.id, title: u.title, address: u.property_address ?? undefined },
      });
    }

    // Sort by timestamp and limit
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      activities: activities.slice(0, limit),
    });
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}
