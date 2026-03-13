// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** Add a comment from a shared link viewer (client comment). Body: token, password?, leaseId, content, clauseId?, analysisId?, parentCommentId?, guestName?, guestEmail? */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      token,
      password,
      leaseId,
      content,
      clauseId,
      analysisId,
      parentCommentId,
      guestName,
      guestEmail,
    } = body as {
      token: string;
      password?: string;
      leaseId: string;
      content: string;
      clauseId?: string;
      analysisId?: string;
      parentCommentId?: string;
      guestName?: string;
      guestEmail?: string;
    };

    if (!token?.trim() || !leaseId || !content?.trim()) {
      return NextResponse.json(
        { error: "token, leaseId, and content are required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: link } = await supabase
      .from("share_links")
      .select("id, lease_id, allow_comments, password_hash, expires_at")
      .eq("token", token.trim())
      .maybeSingle();

    if (!link || link.lease_id !== leaseId) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }
    if (!link.allow_comments) {
      return NextResponse.json(
        { error: "Comments are disabled for this link" },
        { status: 403 }
      );
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }
    if (link.password_hash) {
      const provided = password ?? "";
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET ?? "leaseai-share-secret";
      const hash = createHash("sha256")
        .update(provided + secret)
        .digest("hex");
      if (hash !== link.password_hash) {
        return NextResponse.json(
          { error: "Password required" },
          { status: 401 }
        );
      }
    }

    const { data: comment, error: insertError } = await supabase
      .from("lease_comments")
      .insert({
        lease_id: leaseId,
        clause_id: clauseId || null,
        analysis_id: analysisId || null,
        parent_comment_id: parentCommentId || null,
        user_id: null,
        share_link_id: link.id,
        guest_name: guestName?.trim() || null,
        guest_email: guestEmail?.trim() || null,
        content: content.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Client comment insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to add comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    console.error("Client comment error:", err);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
