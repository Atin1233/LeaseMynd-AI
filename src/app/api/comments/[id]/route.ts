// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

interface UpdateCommentRequest {
  content: string;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateCommentRequest = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    // Get comment and verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from("lease_comments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json(
        { error: "You can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update comment
    const { data: updatedComment, error: updateError } = await supabase
      .from("lease_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        user:profiles!lease_comments_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error("Comment update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error("Comment update error:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get comment and verify ownership or admin role
    const { data: comment, error: fetchError } = await supabase
      .from("lease_comments")
      .select("*, lease:leases!inner(organization_id)")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Get user's profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const canDelete =
      comment.user_id === user.id ||
      (profile &&
        profile.organization_id === (comment.lease as any)?.organization_id &&
        ["owner", "admin"].includes(profile.role || ""));

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Delete comment (cascade will handle replies)
    const { error: deleteError } = await supabase
      .from("lease_comments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Comment delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
