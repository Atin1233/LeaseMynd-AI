// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** DELETE: revoke API key. */
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
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id || (profile.role !== "owner" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: key } = await supabase
      .from("api_keys")
      .select("id, organization_id")
      .eq("id", id)
      .is("revoked_at", null)
      .maybeSingle();

    if (!key || key.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("API key revoke error:", error);
      return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API key revoke error:", err);
    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
}
