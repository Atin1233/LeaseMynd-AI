// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** GET: list version history for a template. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
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
      return NextResponse.json({ error: "Not in organization" }, { status: 403 });
    }

    const { data: template } = await supabase
      .from("lease_templates")
      .select("id, organization_id, is_prebuilt")
      .eq("id", templateId)
      .maybeSingle();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.is_prebuilt && template.organization_id === null) {
      return NextResponse.json({ versions: [] });
    }

    if (template.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: versions, error } = await supabase
      .from("lease_template_versions")
      .select("id, version_number, content_json, created_at")
      .eq("template_id", templateId)
      .order("version_number", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Template versions error:", error);
      return NextResponse.json({ error: "Failed to load versions" }, { status: 500 });
    }

    return NextResponse.json({ versions: versions ?? [] });
  } catch (err) {
    console.error("Template versions error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
