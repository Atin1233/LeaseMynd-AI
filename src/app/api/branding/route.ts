// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** GET: fetch organization branding (white-label). Broker plan. */
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
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "User not in an organization" },
        { status: 403 }
      );
    }

    const { data: branding, error } = await supabase
      .from("organization_branding")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (error) {
      console.error("Branding fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load branding" },
        { status: 500 }
      );
    }

    return NextResponse.json({ branding: branding ?? null });
  } catch (err) {
    console.error("Branding GET error:", err);
    return NextResponse.json(
      { error: "Failed to load branding" },
      { status: 500 }
    );
  }
}

/** PUT: update organization branding (white-label). Body: logo_url?, primary_color?, secondary_color?, custom_domain?. Broker plan. */
export async function PUT(request: Request) {
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
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "User not in an organization" },
        { status: 403 }
      );
    }

    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Only owners and admins can update branding" },
        { status: 403 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (org?.plan !== "broker" && org?.plan !== "free") {
      return NextResponse.json(
        { error: "White-label branding is available on Broker plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { logo_url, primary_color, secondary_color, custom_domain } = body as {
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
      custom_domain?: string | null;
    };

    const { data: branding, error: upsertError } = await supabase
      .from("organization_branding")
      .upsert(
        {
          organization_id: profile.organization_id,
          logo_url: logo_url ?? null,
          primary_color: primary_color ?? null,
          secondary_color: secondary_color ?? null,
          custom_domain: custom_domain?.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Branding upsert error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save branding" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, branding });
  } catch (err) {
    console.error("Branding PUT error:", err);
    return NextResponse.json(
      { error: "Failed to save branding" },
      { status: 500 }
    );
  }
}
