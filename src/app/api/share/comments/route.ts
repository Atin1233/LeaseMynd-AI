// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** Get comments for a shared lease. Query: token, leaseId, optional password in header x-share-password. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const leaseId = searchParams.get("leaseId");
    if (!token?.trim() || !leaseId) {
      return NextResponse.json(
        { error: "token and leaseId are required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: link } = await supabase
      .from("share_links")
      .select("id, lease_id, password_hash, expires_at")
      .eq("token", token.trim())
      .maybeSingle();

    if (!link || link.lease_id !== leaseId) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }
    const passwordHeader = request.headers.get("x-share-password");
    if (link.password_hash) {
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: "Server misconfiguration: SHARE_LINK_SECRET not set" },
          { status: 500 }
        );
      }
      const hash = createHash("sha256")
        .update((passwordHeader ?? "") + secret)
        .digest("hex");
      if (hash !== link.password_hash) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
    }

    const { data: topLevel } = await supabase
      .from("lease_comments")
      .select(`
        id, lease_id, clause_id, analysis_id, parent_comment_id, user_id, content, created_at, updated_at,
        share_link_id, guest_name, guest_email,
        user:profiles!lease_comments_user_id_fkey (id, email, full_name, avatar_url)
      `)
      .eq("lease_id", leaseId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false });

    if (!topLevel?.length) {
      return NextResponse.json({ comments: [] });
    }

    const ids = topLevel.map((c) => c.id);
    const { data: replies } = await supabase
      .from("lease_comments")
      .select(`
        id, lease_id, clause_id, analysis_id, parent_comment_id, user_id, content, created_at, updated_at,
        share_link_id, guest_name, guest_email,
        user:profiles!lease_comments_user_id_fkey (id, email, full_name, avatar_url)
      `)
      .in("parent_comment_id", ids)
      .order("created_at", { ascending: true });

    const comments = topLevel.map((c) => ({
      ...c,
      replies: (replies ?? []).filter((r) => r.parent_comment_id === c.id),
    }));

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Share comments fetch error:", err);
    return NextResponse.json({ comments: [] }, { status: 500 });
  }
}
