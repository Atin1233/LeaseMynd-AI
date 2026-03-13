// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { getApiKeyAuth, touchApiKey } from "~/lib/auth/api-key";

export const runtime = "nodejs";

/** GET: list all leases for org with analysis summary (portfolio view). Query: dueDiligence=true for fast-scan filter. */
export async function GET(request: Request) {
  try {
    const apiKeyAuth = await getApiKeyAuth(request);
    const supabase = await createClient();
    let organizationId: string | null = null;

    if (apiKeyAuth) {
      organizationId = apiKeyAuth.organizationId;
      void touchApiKey(apiKeyAuth.keyId);
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      organizationId = profile?.organization_id ?? null;
    }

    if (!organizationId) {
      return NextResponse.json({ leases: [], summary: null });
    }

    const { searchParams } = new URL(request.url);
    const dueDiligence = searchParams.get("dueDiligence") === "true";

    const { data: leases, error } = await supabase
      .from("leases")
      .select(
        `
        id,
        title,
        property_address,
        property_type,
        status,
        created_at,
        page_count,
        lease_analyses (
          id,
          risk_score,
          risk_level,
          executive_summary,
          created_at
        )
      `
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Portfolio fetch error:", error);
      return NextResponse.json({ leases: [], summary: null });
    }

    const list = (leases ?? []).map((l) => ({
      ...l,
      risk_score: l.lease_analyses?.[0]?.risk_score ?? null,
      risk_level: l.lease_analyses?.[0]?.risk_level ?? null,
      analysis_id: l.lease_analyses?.[0]?.id ?? null,
    }));

    const analyzed = list.filter((l) => l.risk_score != null);
    const summary = {
      total: list.length,
      analyzed: analyzed.length,
      pending: list.filter((l) => l.status === "pending" || l.status === "processing").length,
      avg_risk: analyzed.length
        ? Math.round(
            analyzed.reduce((a, l) => a + (l.risk_score ?? 0), 0) / analyzed.length
          )
        : null,
      high_risk: analyzed.filter(
        (l) => l.risk_level === "high" || l.risk_level === "critical"
      ).length,
    };

    return NextResponse.json({
      leases: dueDiligence ? list.filter((l) => l.status === "analyzed") : list,
      summary,
    });
  } catch (err) {
    console.error("Portfolio error:", err);
    return NextResponse.json({ leases: [], summary: null }, { status: 500 });
  }
}
