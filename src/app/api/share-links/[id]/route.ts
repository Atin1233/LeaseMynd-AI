// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** Revoke (delete) a share link. Broker plan. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { data: link } = await supabase
      .from("share_links")
      .select("id, organization_id")
      .eq("id", id)
      .maybeSingle();

    if (!link || link.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("share_links")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Share link delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to revoke share link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Share link delete error:", err);
    return NextResponse.json(
      { error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
