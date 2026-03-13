// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** GET: list templates (pre-built + org custom). */
export async function GET() {
  try {
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
      return NextResponse.json({ templates: [] });
    }

    const { data: prebuilt } = await supabase
      .from("lease_templates")
      .select("*")
      .is("organization_id", null)
      .eq("is_prebuilt", true)
      .order("name");

    const { data: orgTemplates } = await supabase
      .from("lease_templates")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("is_prebuilt", false)
      .order("updated_at", { ascending: false });

    const templates = [...(prebuilt ?? []), ...(orgTemplates ?? [])];
    return NextResponse.json({ templates });
  } catch (err) {
    console.error("Templates list error:", err);
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
}

/** POST: create custom template. Body: name, description?, structure_type?, content_json?, shared_with_org?. */
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

    const body = await request.json();
    const { name, description, structure_type, content_json, shared_with_org = true } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("lease_templates")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        structure_type: structure_type?.trim() || null,
        content_json: content_json ?? null,
        is_prebuilt: false,
        shared_with_org: !!shared_with_org,
      })
      .select()
      .single();

    if (error) {
      console.error("Template create error:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template });
  } catch (err) {
    console.error("Template create error:", err);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
