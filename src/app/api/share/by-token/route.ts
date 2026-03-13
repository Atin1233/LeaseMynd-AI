// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** Public: resolve share by token. Query: token. Body (optional): password. Returns lease + analysis summary for shared view. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    if (!token?.trim()) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: link, error: linkError } = await supabase
      .from("share_links")
      .select("*")
      .eq("token", token.trim())
      .maybeSingle();

    if (linkError || !link) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }

    const passwordHeader = request.headers.get("x-share-password");
    if (link.password_hash) {
      const provided = passwordHeader ?? "";
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: "Server misconfiguration: SHARE_LINK_SECRET not set" },
          { status: 500 }
        );
      }
      const hash = createHash("sha256")
        .update(provided + secret)
        .digest("hex");
      if (hash !== link.password_hash) {
        return NextResponse.json(
          { error: "Password required", requiresPassword: true },
          { status: 401 }
        );
      }
    }

    const { data: lease } = await supabase
      .from("leases")
      .select("id, title, property_address, property_type, status, created_at, page_count")
      .eq("id", link.lease_id)
      .maybeSingle();

    if (!lease) {
      return NextResponse.json(
        { error: "Lease not found" },
        { status: 404 }
      );
    }

    const { data: analysis } = await supabase
      .from("lease_analyses")
      .select("id, risk_score, risk_level, executive_summary, strengths, concerns, high_risk_items, recommendations, created_at")
      .eq("lease_id", link.lease_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: clauses } = await supabase
      .from("clause_extractions")
      .select("id, category, clause_type, original_text, plain_english_explanation, risk_impact, page_numbers")
      .eq("lease_id", link.lease_id)
      .order("category");

    const { data: branding } = await supabase
      .from("organization_branding")
      .select("logo_url, primary_color, secondary_color")
      .eq("organization_id", link.organization_id)
      .maybeSingle();

    return NextResponse.json({
      shareLink: {
        id: link.id,
        allow_comments: link.allow_comments,
        label: link.label,
      },
      lease,
      analysis: analysis ?? null,
      clauses: clauses ?? [],
      branding: branding ?? null,
    });
  } catch (err) {
    console.error("Share by-token error:", err);
    return NextResponse.json(
      { error: "Invalid or expired link" },
      { status: 500 }
    );
  }
}
