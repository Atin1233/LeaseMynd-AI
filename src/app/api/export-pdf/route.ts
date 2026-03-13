// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leaseId } = await request.json();

    if (!leaseId) {
      return NextResponse.json(
        { error: "Lease ID is required" },
        { status: 400 }
      );
    }

    // Get lease details
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    // Get analysis
    const { data: analysis, error: analysisError } = await supabase
      .from("lease_analyses")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found. Please analyze the lease first." },
        { status: 404 }
      );
    }

    // Get clauses
    const { data: clauses } = await supabase
      .from("clause_extractions")
      .select("*")
      .eq("lease_id", leaseId)
      .order("category");

    // Generate HTML for PDF (server-side PDF generation)
    const html = generatePdfHtml(lease, analysis, clauses || []);

    // Return HTML content that can be printed/saved as PDF on client
    return NextResponse.json({
      success: true,
      html,
      filename: `LeaseAI-Analysis-${lease.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

interface Lease {
  title: string;
  property_address: string | null;
  property_type: string | null;
  created_at: string;
}

interface Analysis {
  risk_score: number | null;
  risk_level: string | null;
  executive_summary: string | null;
  strengths: unknown;
  concerns: unknown;
  high_risk_items: unknown;
  recommendations: unknown;
  market_comparison: unknown;
  processing_time_ms: number | null;
  created_at: string;
}

interface Clause {
  category: string;
  clause_type: string;
  original_text: string;
  plain_english_explanation: string | null;
  risk_impact: number | null;
  recommendations: string[] | null;
}

function generatePdfHtml(
  lease: Lease,
  analysis: Analysis,
  clauses: Clause[]
): string {
  const strengths = Array.isArray(analysis.strengths)
    ? (analysis.strengths as string[])
    : [];
  const concerns = Array.isArray(analysis.concerns)
    ? (analysis.concerns as string[])
    : [];
  const highRiskItems = Array.isArray(analysis.high_risk_items)
    ? (analysis.high_risk_items as string[])
    : [];
  const recommendations = Array.isArray(analysis.recommendations)
    ? (analysis.recommendations as string[])
    : [];

  const riskColor =
    analysis.risk_level === "low"
      ? "#16a34a"
      : analysis.risk_level === "medium"
        ? "#d97706"
        : analysis.risk_level === "high"
          ? "#dc2626"
          : "#7c2d12";

  const riskBg =
    analysis.risk_level === "low"
      ? "#dcfce7"
      : analysis.risk_level === "medium"
        ? "#fef3c7"
        : analysis.risk_level === "high"
          ? "#fee2e2"
          : "#fecaca";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LeaseAI Analysis Report - ${lease.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1c1917;
      line-height: 1.6;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 2px solid #e7e5e4;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 24px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 5px;
    }
    .report-meta {
      color: #78716c;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e7e5e4;
    }
    .risk-score-box {
      text-align: center;
      padding: 30px;
      background: ${riskBg};
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .risk-score {
      font-size: 64px;
      font-weight: 700;
      color: ${riskColor};
    }
    .risk-label {
      font-size: 18px;
      color: ${riskColor};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .summary-text {
      color: #44403c;
      font-size: 15px;
      line-height: 1.7;
    }
    .list-section {
      margin-bottom: 20px;
    }
    .list-title {
      font-weight: 600;
      color: #1c1917;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .list-title.strengths { color: #16a34a; }
    .list-title.concerns { color: #d97706; }
    .list-title.high-risk { color: #dc2626; }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
      color: #44403c;
      font-size: 14px;
    }
    li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #a8a29e;
    }
    .clause-card {
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .clause-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .clause-type {
      font-weight: 600;
      color: #1c1917;
    }
    .clause-category {
      font-size: 12px;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .clause-text {
      color: #44403c;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .clause-explanation {
      background: #f5f5f4;
      padding: 12px;
      border-radius: 6px;
      font-size: 13px;
      color: #57534e;
    }
    .recommendations-list {
      background: #eff6ff;
      padding: 20px;
      border-radius: 10px;
    }
    .recommendations-list li::before {
      content: "→";
      color: #2563eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e7e5e4;
      text-align: center;
      color: #78716c;
      font-size: 12px;
    }
    .disclaimer {
      font-style: italic;
      color: #a8a29e;
      font-size: 11px;
      margin-top: 10px;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LeaseAI</div>
    <div class="report-title">${lease.title}</div>
    <div class="report-meta">
      ${lease.property_address ? `${lease.property_address} • ` : ""}
      ${lease.property_type ? `${lease.property_type.charAt(0).toUpperCase() + lease.property_type.slice(1)} Property • ` : ""}
      Analysis Date: ${new Date(analysis.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
    </div>
  </div>

  <div class="risk-score-box">
    <div class="risk-score">${analysis.risk_score || "N/A"}</div>
    <div class="risk-label">${analysis.risk_level || "Unknown"} Risk</div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <p class="summary-text">${analysis.executive_summary || "No summary available."}</p>
  </div>

  ${
    strengths.length > 0
      ? `
  <div class="list-section">
    <div class="list-title strengths">✓ Strengths (${strengths.length})</div>
    <ul>
      ${strengths.map((s) => `<li>${s}</li>`).join("")}
    </ul>
  </div>
  `
      : ""
  }

  ${
    concerns.length > 0
      ? `
  <div class="list-section">
    <div class="list-title concerns">⚠ Concerns (${concerns.length})</div>
    <ul>
      ${concerns.map((c) => `<li>${c}</li>`).join("")}
    </ul>
  </div>
  `
      : ""
  }

  ${
    highRiskItems.length > 0
      ? `
  <div class="list-section">
    <div class="list-title high-risk">✕ High Risk Items (${highRiskItems.length})</div>
    <ul>
      ${highRiskItems.map((h) => `<li>${h}</li>`).join("")}
    </ul>
  </div>
  `
      : ""
  }

  ${
    recommendations.length > 0
      ? `
  <div class="section">
    <div class="section-title">Recommendations</div>
    <div class="recommendations-list">
      <ul>
        ${recommendations.map((r) => `<li>${r}</li>`).join("")}
      </ul>
    </div>
  </div>
  `
      : ""
  }

  ${
    clauses.length > 0
      ? `
  <div class="section">
    <div class="section-title">Clause Analysis (${clauses.length} clauses)</div>
    ${clauses
      .slice(0, 20)
      .map(
        (clause) => `
    <div class="clause-card">
      <div class="clause-header">
        <span class="clause-type">${clause.clause_type}</span>
        <span class="clause-category">${clause.category}</span>
      </div>
      ${clause.plain_english_explanation ? `<div class="clause-explanation">${clause.plain_english_explanation}</div>` : ""}
    </div>
    `
      )
      .join("")}
    ${clauses.length > 20 ? `<p style="color: #78716c; font-size: 13px; text-align: center;">... and ${clauses.length - 20} more clauses</p>` : ""}
  </div>
  `
      : ""
  }

  <div class="footer">
    <div>Generated by LeaseAI • ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    <div class="disclaimer">
      This analysis is for informational purposes only and does not constitute legal advice.
      Always consult with qualified legal counsel for legal decisions.
    </div>
  </div>
</body>
</html>
  `;
}

