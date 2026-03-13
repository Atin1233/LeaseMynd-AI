// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST: Compare lease clauses to a standard template. Body: { leaseId, templateId? }. */
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

    const body = await request.json();
    const { leaseId, templateId } = body as { leaseId?: string; templateId?: string };

    if (!leaseId || typeof leaseId !== "string") {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "User not in organization" }, { status: 403 });
    }

    const { data: lease } = await supabase
      .from("leases")
      .select("id, organization_id, title")
      .eq("id", leaseId)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const { data: clauses } = await supabase
      .from("clause_extractions")
      .select("category, subcategory, clause_type, original_text, plain_english_explanation, risk_impact, recommendations")
      .eq("lease_id", leaseId)
      .order("category");

    if (!clauses?.length) {
      return NextResponse.json(
        { error: "Lease has no clause analysis. Run analysis first." },
        { status: 400 }
      );
    }

    let templateContext = "market-standard commercial lease terms";
    if (templateId) {
      const { data: template } = await supabase
        .from("lease_templates")
        .select("name, description, structure_type, content_json")
        .eq("id", templateId)
        .maybeSingle();
      if (template) {
        templateContext = `template "${template.name}" (${template.description || template.structure_type || "lease"})`;
        if (template.content_json && typeof template.content_json === "object") {
          templateContext += `. Template structure: ${JSON.stringify(template.content_json).slice(0, 2000)}`;
        }
      }
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const clausesText = clauses
      .map(
        (c) =>
          `[${c.category}${c.subcategory ? ` / ${c.subcategory}` : ""}] ${c.clause_type}\n` +
          `Lease text: ${(c.original_text ?? "").slice(0, 500)}\n` +
          `Explanation: ${c.plain_english_explanation ?? "N/A"}\n` +
          `Risk impact: ${c.risk_impact ?? "N/A"}\n` +
          `Recommendations: ${Array.isArray(c.recommendations) ? c.recommendations.join("; ") : "N/A"}\n`
      )
      .join("\n---\n");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a commercial lease analyst. Compare the following lease clauses to ${templateContext}.

For each clause, provide:
1. How the lease deviates from the standard (if at all)
2. Whether the deviation favors tenant or landlord
3. A brief recommendation (what to negotiate or accept)

Return a JSON array of objects with: category, clause_type, deviation (string), favors (tenant|landlord|neutral), recommendation (string).
Focus on clauses with higher risk impact or notable deviations.

Lease clauses:
${clausesText.slice(0, 24000)}

Respond with ONLY valid JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text?.() ?? "[]";
    let comparisons: Array<{
      category: string;
      clause_type: string;
      deviation: string;
      favors: string;
      recommendation: string;
    }> = [];
    try {
      const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
      comparisons = Array.isArray(parsed) ? parsed : [];
    } catch {
      comparisons = [];
    }

    return NextResponse.json({
      success: true,
      leaseId,
      templateId: templateId ?? null,
      comparisons,
    });
  } catch (err) {
    console.error("Compare clauses error:", err);
    return NextResponse.json(
      { error: "Failed to compare clauses" },
      { status: 500 }
    );
  }
}
