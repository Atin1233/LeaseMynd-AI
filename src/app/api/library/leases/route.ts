// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

/**
 * GET /api/library/leases
 * Returns all leases for the user's org with full analysis and vulnerabilities.
 * Used by the Library page "Uploaded Leases" tab.
 */

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select("id, title, property_address, property_type, status, page_count, created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (leasesError) {
      console.error("Library leases error:", leasesError);
      return NextResponse.json(
        { error: "Failed to fetch leases" },
        { status: 500 }
      );
    }

    const leaseIds = (leases ?? []).map((l) => l.id);
    if (leaseIds.length === 0) {
      return NextResponse.json({
        leases: [],
        total: 0,
        limit,
        offset,
      });
    }

    const { data: analyses } = await supabase
      .from("lease_analyses")
      .select("id, lease_id, risk_score, risk_level, executive_summary, strengths, concerns, high_risk_items, recommendations, analysis_metadata, market_comparison, created_at")
      .in("lease_id", leaseIds)
      .order("created_at", { ascending: false });

    const byLease = new Map<string, typeof analyses[0]>();
    for (const a of analyses ?? []) {
      if (!byLease.has(a.lease_id)) {
        byLease.set(a.lease_id, a);
      }
    }

    const { data: clauses } = await supabase
      .from("clause_extractions")
      .select("lease_id, category, clause_type, original_text, plain_english_explanation, risk_impact, is_standard, recommendations")
      .in("lease_id", leaseIds);

    const clausesByLease = new Map<string, typeof clauses>();
    for (const c of clauses ?? []) {
      const list = clausesByLease.get(c.lease_id) ?? [];
      list.push(c);
      clausesByLease.set(c.lease_id, list);
    }

    const enriched = (leases ?? []).map((lease) => {
      const analysis = byLease.get(lease.id);
      const leaseClauses = clausesByLease.get(lease.id) ?? [];
      const strengths = (analysis?.strengths as any[]) ?? [];
      const concerns = (analysis?.concerns as any[]) ?? [];
      const highRisk = (analysis?.high_risk_items as any[]) ?? [];
      const recs = (analysis?.recommendations as any[]) ?? [];
      const meta = (analysis?.analysis_metadata as Record<string, unknown>) ?? {};
      const missingClauses = (meta.missingClauses as any[]) ?? [];

      return {
        id: lease.id,
        title: lease.title,
        propertyAddress: lease.property_address,
        propertyType: lease.property_type,
        status: lease.status,
        pageCount: lease.page_count,
        createdAt: lease.created_at,
        analysis: analysis
          ? {
              id: analysis.id,
              riskScore: analysis.risk_score,
              riskLevel: analysis.risk_level,
              executiveSummary: analysis.executive_summary,
              analyzedAt: analysis.created_at,
              strengths,
              concerns,
              highRiskItems: highRisk,
              missingClauses,
              recommendations: recs,
              marketComparison: analysis.market_comparison,
              negotiationPriorities: meta.negotiationPriorities,
            }
          : null,
        clauses: leaseClauses,
      };
    });

    return NextResponse.json({
      leases: enriched,
      total: enriched.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Library leases error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
