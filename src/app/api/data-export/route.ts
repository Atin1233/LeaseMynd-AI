// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** GET: export all user/org data (GDPR-style). Returns JSON bundle. */
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
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      const bundle = {
        exported_at: new Date().toISOString(),
        user: { id: user.id, email: user.email },
        profile: profile ?? null,
        organization: null,
        leases: [],
        lease_analyses: [],
      };
      return NextResponse.json(bundle, {
        headers: {
          "Content-Disposition": `attachment; filename="leaseai-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      });
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();

    const { data: leases } = await supabase
      .from("leases")
      .select("id, title, property_address, property_type, status, created_at, updated_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    const leaseIds = (leases ?? []).map((l) => l.id);
    let analyses: unknown[] = [];
    if (leaseIds.length > 0) {
      const { data: analysesData } = await supabase
        .from("lease_analyses")
        .select("id, lease_id, risk_score, risk_level, executive_summary, created_at")
        .in("lease_id", leaseIds);
      analyses = analysesData ?? [];
    }

    const bundle = {
      exported_at: new Date().toISOString(),
      user: { id: user.id, email: user.email },
      profile,
      organization: org,
      leases: leases ?? [],
      lease_analyses: analyses,
    };

    return new NextResponse(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="leaseai-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    console.error("Data export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
