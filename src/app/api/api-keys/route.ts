// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { randomBytes, createHash } from "crypto";

export const runtime = "nodejs";

const KEY_PREFIX = "lai_";
const KEY_BYTES = 24;

function generateKey(): { raw: string; prefix: string; hash: string } {
  const raw = KEY_PREFIX + randomBytes(KEY_BYTES).toString("base64url");
  const prefix = raw.slice(0, KEY_PREFIX.length + 8);
  const hash = createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

/** GET: list API keys for org (prefix only, no full key). */
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
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id || (profile.role !== "owner" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, name, key_prefix, last_used_at, created_at, revoked_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("API keys list error:", error);
      return NextResponse.json({ error: "Failed to list keys" }, { status: 500 });
    }

    return NextResponse.json({ apiKeys: keys ?? [] });
  } catch (err) {
    console.error("API keys error:", err);
    return NextResponse.json({ error: "Failed to list keys" }, { status: 500 });
  }
}

/** POST: create API key. Body: name. Returns key once (raw); store it. */
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id || (profile.role !== "owner" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "API key";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const { raw, prefix, hash } = generateKey();

    const { data: key, error } = await supabase
      .from("api_keys")
      .insert({
        organization_id: profile.organization_id,
        created_by: user.id,
        name,
        key_prefix: prefix,
        key_hash: hash,
      })
      .select("id, name, key_prefix, created_at")
      .single();

    if (error) {
      console.error("API key create error:", error);
      return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      apiKey: { ...key, key: raw },
      message: "Copy the key now; it will not be shown again.",
    });
  } catch (err) {
    console.error("API key create error:", err);
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}
