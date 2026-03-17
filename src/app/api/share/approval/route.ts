// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** GET: get current approval for shared view. Query: token, leaseId. Optional header x-share-password. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const leaseId = searchParams.get("leaseId");
    if (!token?.trim() || !leaseId) {
      return NextResponse.json({ error: "token and leaseId required" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { data: link } = await supabase
      .from("share_links")
      .select("id, lease_id, password_hash, expires_at")
      .eq("token", token.trim())
      .maybeSingle();

    if (!link || link.lease_id !== leaseId) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }

    const passwordHeader = request.headers.get("x-share-password");
    if (link.password_hash) {
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET;
      if (!secret) {
        return NextResponse.json(
          { error: "Server misconfiguration: SHARE_LINK_SECRET not set" },
          { status: 500 }
        );
      }
      const hash = createHash("sha256")
        .update((passwordHeader ?? "") + secret)
        .digest("hex");
      if (hash !== link.password_hash) {
        return NextResponse.json({ error: "Password required", requiresPassword: true }, { status: 401 });
      }
    }

    const { data: workflow } = await supabase
      .from("approval_workflows")
      .select("id, status, response_note, responded_at")
      .eq("share_link_id", link.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ approval: workflow ?? null });
  } catch (err) {
    console.error("Share approval GET error:", err);
    return NextResponse.json({ error: "Failed to load approval" }, { status: 500 });
  }
}

/** POST: client submits approval (approve / request changes). Body: token, password?, status, note? */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, status, note } = body as {
      token: string;
      password?: string;
      status: "approved" | "changes_requested";
      note?: string;
    };

    if (!token?.trim() || !status || !["approved", "changes_requested"].includes(status)) {
      return NextResponse.json(
        { error: "token and status (approved or changes_requested) required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: link } = await supabase
      .from("share_links")
      .select("id, lease_id, password_hash, expires_at")
      .eq("token", token.trim())
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }
    if (link.password_hash) {
      const provided = password ?? "";
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET ?? "leasemynd-share-secret";
      const hash = createHash("sha256").update(provided + secret).digest("hex");
      if (hash !== link.password_hash) {
        return NextResponse.json({ error: "Password required" }, { status: 401 });
      }
    }

    const { data: existing } = await supabase
      .from("approval_workflows")
      .select("id")
      .eq("share_link_id", link.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("approval_workflows")
        .update({
          status,
          response_note: note?.trim() || null,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Approval update error:", error);
        return NextResponse.json({ error: "Failed to update approval" }, { status: 500 });
      }
      return NextResponse.json({ success: true, approval: updated });
    }

    const { data: created, error } = await supabase
      .from("approval_workflows")
      .insert({
        share_link_id: link.id,
        status,
        response_note: note?.trim() || null,
        responded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Approval create error:", error);
      return NextResponse.json({ error: "Failed to submit approval" }, { status: 500 });
    }
    return NextResponse.json({ success: true, approval: created });
  } catch (err) {
    console.error("Share approval POST error:", err);
    return NextResponse.json({ error: "Failed to submit approval" }, { status: 500 });
  }
}
