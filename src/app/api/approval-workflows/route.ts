// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** GET: list approval workflows for share links of a lease. Query: shareLinkId or leaseId. */
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

    const { searchParams } = new URL(request.url);
    const shareLinkId = searchParams.get("shareLinkId");
    const leaseId = searchParams.get("leaseId");

    if (shareLinkId) {
      const { data: link } = await supabase
        .from("share_links")
        .select("id, organization_id")
        .eq("id", shareLinkId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!link || !profile || link.organization_id !== profile.organization_id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const { data: workflows } = await supabase
        .from("approval_workflows")
        .select("id, share_link_id, status, response_note, responded_at, created_at")
        .eq("share_link_id", shareLinkId)
        .order("created_at", { ascending: false });

      return NextResponse.json({ workflows: workflows ?? [] });
    }

    if (leaseId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.organization_id) {
        return NextResponse.json({ workflows: [] });
      }

      const { data: links } = await supabase
        .from("share_links")
        .select("id")
        .eq("lease_id", leaseId)
        .eq("organization_id", profile.organization_id);

      if (!links?.length) {
        return NextResponse.json({ workflows: [] });
      }

      const linkIds = links.map((l) => l.id);
      const { data: workflows } = await supabase
        .from("approval_workflows")
        .select("id, share_link_id, status, response_note, responded_at, created_at")
        .in("share_link_id", linkIds)
        .order("created_at", { ascending: false });

      const withLink = (workflows ?? []).map((w) => ({
        ...w,
        share_link: links.find((l) => l.id === w.share_link_id),
      }));
      return NextResponse.json({ workflows: withLink });
    }

    return NextResponse.json({ error: "shareLinkId or leaseId required" }, { status: 400 });
  } catch (err) {
    console.error("Approval workflows GET error:", err);
    return NextResponse.json({ error: "Failed to list approvals" }, { status: 500 });
  }
}
