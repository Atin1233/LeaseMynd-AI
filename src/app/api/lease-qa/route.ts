// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST: natural language Q&A over a lease. Body: { leaseId, question }. E.g. "What are the termination clauses?", "What should I negotiate?" */
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
    const { leaseId, question } = body as { leaseId?: string; question?: string };

    if (!leaseId || !question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "leaseId and question are required" },
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
      .select("id, organization_id")
      .eq("id", leaseId)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    const { data: chunks } = await supabase
      .from("lease_chunks")
      .select("page, content")
      .eq("lease_id", leaseId)
      .order("page")
      .order("chunk_index")
      .limit(50);

    if (!chunks?.length) {
      return NextResponse.json(
        { error: "Lease has no extracted text. Run analysis first." },
        { status: 400 }
      );
    }

    const context = chunks.map((c) => `[Page ${c.page}]\n${c.content}`).join("\n\n");
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a commercial lease analyst. Answer the user's question based ONLY on the following lease text. Be concise and cite page numbers when relevant. If the answer is not in the text, say so.

Lease text:
${context.slice(0, 28000)}

User question: ${question.trim()}

Answer:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text?.() ?? "No answer generated.";

    return NextResponse.json({ success: true, answer: text });
  } catch (err) {
    console.error("Lease Q&A error:", err);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 }
    );
  }
}
