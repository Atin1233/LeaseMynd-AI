// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/** Record a view on a shared analysis (analytics). Body: token, optional password. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token =
      typeof body?.token === "string" ? body.token.trim() : null;
    if (!token) {
      return NextResponse.json(
        { error: "token is required" },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: link } = await supabase
      .from("share_links")
      .select("id, password_hash, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!link) {
      return NextResponse.json({ success: false }, { status: 404 });
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ success: false }, { status: 410 });
    }
    if (link.password_hash) {
      const provided = body.password ?? "";
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET ?? "leaseai-share-secret";
      const hash = createHash("sha256")
        .update(provided + secret)
        .digest("hex");
      if (hash !== link.password_hash) {
        return NextResponse.json({ success: false }, { status: 401 });
      }
    }

    const userAgent = request.headers.get("user-agent") ?? null;
    const referrer = request.headers.get("referer") ?? null;
    let ipHash: string | null = null;
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");
    if (ip) {
      const { createHash } = await import("crypto");
      ipHash = createHash("sha256").update(ip).digest("hex");
    }

    await supabase.from("share_link_views").insert({
      share_link_id: link.id,
      ip_hash: ipHash,
      user_agent: userAgent?.slice(0, 500) ?? null,
      referrer: referrer?.slice(0, 500) ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Record view error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
