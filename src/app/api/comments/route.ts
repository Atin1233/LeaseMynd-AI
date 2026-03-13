// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

interface CreateCommentRequest {
  leaseId: string;
  clauseId?: string;
  analysisId?: string;
  content: string;
  parentCommentId?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateCommentRequest = await request.json();
    const { leaseId, clauseId, analysisId, content, parentCommentId } = body;

    if (!leaseId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "leaseId and content are required" },
        { status: 400 }
      );
    }

    // Verify user has access to this lease
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "User not in an organization" },
        { status: 403 }
      );
    }

    const { data: lease } = await supabase
      .from("leases")
      .select("organization_id")
      .eq("id", leaseId)
      .maybeSingle();

    if (!lease || lease.organization_id !== profile.organization_id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Verify clause exists if clauseId provided
    if (clauseId) {
      const { data: clause } = await supabase
        .from("clause_extractions")
        .select("id")
        .eq("id", clauseId)
        .eq("lease_id", leaseId)
        .maybeSingle();

      if (!clause) {
        return NextResponse.json(
          { error: "Clause not found" },
          { status: 404 }
        );
      }
    }

    // Verify analysis exists if analysisId provided
    if (analysisId) {
      const { data: analysis } = await supabase
        .from("lease_analyses")
        .select("id")
        .eq("id", analysisId)
        .eq("lease_id", leaseId)
        .maybeSingle();

      if (!analysis) {
        return NextResponse.json(
          { error: "Analysis not found" },
          { status: 404 }
        );
      }
    }

    // Verify parent comment exists if parentCommentId provided
    if (parentCommentId) {
      const { data: parentComment } = await supabase
        .from("lease_comments")
        .select("id")
        .eq("id", parentCommentId)
        .eq("lease_id", leaseId)
        .maybeSingle();

      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Create comment
    const { data: comment, error: insertError } = await supabase
      .from("lease_comments")
      .insert({
        lease_id: leaseId,
        clause_id: clauseId || null,
        analysis_id: analysisId || null,
        parent_comment_id: parentCommentId || null,
        user_id: user.id,
        content: content.trim(),
      })
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

    if (insertError) {
      console.error("Comment insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

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
    const leaseId = searchParams.get("leaseId");
    const clauseId = searchParams.get("clauseId");
    const analysisId = searchParams.get("analysisId");

    if (!leaseId) {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    // Verify user has access
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json({ comments: [] });
    }

    const { data: lease } = await supabase
      .from("leases")
      .select("organization_id")
      .eq("id", leaseId)
      .maybeSingle();

    if (!lease || lease.organization_id !== profile.organization_id) {
      return NextResponse.json({ comments: [] });
    }

    // Build query
    let query = supabase
      .from("lease_comments")
      .select(`
        *,
        user:profiles!lease_comments_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq("lease_id", leaseId)
      .is("parent_comment_id", null) // Only get top-level comments
      .order("created_at", { ascending: false });

    if (clauseId) {
      query = query.eq("clause_id", clauseId);
    }

    if (analysisId) {
      query = query.eq("analysis_id", analysisId);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json({ comments: [] });
    }

    // Fetch replies for each comment
    if (comments && comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      const { data: replies } = await supabase
        .from("lease_comments")
        .select(`
          *,
          user:profiles!lease_comments_user_id_fkey (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .in("parent_comment_id", commentIds)
        .order("created_at", { ascending: true });

      // Attach replies to parent comments
      const commentsWithReplies = comments.map((comment) => ({
        ...comment,
        replies: replies?.filter((r) => r.parent_comment_id === comment.id) || [],
      }));

      return NextResponse.json({ comments: commentsWithReplies });
    }

    return NextResponse.json({ comments: [] });
  } catch (error) {
    console.error("Comments fetch error:", error);
    return NextResponse.json({ comments: [] });
  }
}
