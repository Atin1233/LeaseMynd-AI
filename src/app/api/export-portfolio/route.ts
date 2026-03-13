// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

/** GET: export portfolio as CSV or Excel. Query: format=csv (default) | format=xlsx */
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
      return NextResponse.json({ error: "No organization" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "csv").toLowerCase();
    const isXlsx = format === "xlsx" || format === "excel";

    const { data: leases } = await supabase
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
          risk_score,
          risk_level,
          executive_summary,
          created_at
        )
      `
      )
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    const rows = (leases ?? []).map((l) => {
      const a = l.lease_analyses?.[0];
      return {
        id: l.id,
        title: l.title ?? "",
        property_address: l.property_address ?? "",
        property_type: l.property_type ?? "",
        status: l.status ?? "",
        page_count: l.page_count ?? "",
        risk_score: a?.risk_score ?? "",
        risk_level: a?.risk_level ?? "",
        analyzed_at: a?.created_at ?? "",
        summary: (a?.executive_summary ?? "").replace(/[\r\n]+/g, " ").slice(0, 500),
      };
    });

    const dateStr = new Date().toISOString().slice(0, 10);

    if (isXlsx) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Portfolio");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="portfolio-${dateStr}.xlsx"`,
        },
      });
    }

    const headers = [
      "id",
      "title",
      "property_address",
      "property_type",
      "status",
      "page_count",
      "risk_score",
      "risk_level",
      "analyzed_at",
      "summary",
    ];
    const escape = (v: string | number) => {
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n"))
        return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv =
      headers.join(",") +
      "\n" +
      rows.map((r) => headers.map((h) => escape((r as Record<string, string | number>)[h] ?? "")).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="portfolio-${dateStr}.csv"`,
      },
    });
  } catch (err) {
    console.error("Export portfolio error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
