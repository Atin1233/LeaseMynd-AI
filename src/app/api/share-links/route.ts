// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

/** Generate a URL-safe token for share links */
function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Create a new share link (Broker plan). POST body: leaseId, password?, expiresAt?, label?, allowComments? */
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

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "User not in an organization" },
        { status: 403 }
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (org?.plan !== "broker" && org?.plan !== "free") {
      return NextResponse.json(
        { error: "Client sharing is available on Broker plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      leaseId,
      password,
      expiresAt,
      label,
      allowComments = true,
    } = body as {
      leaseId: string;
      password?: string;
      expiresAt?: string;
      label?: string;
      allowComments?: boolean;
    };

    if (!leaseId) {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
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

    let passwordHash: string | null = null;
    if (password && typeof password === "string" && password.trim()) {
      const { createHash } = await import("crypto");
      const secret = process.env.SHARE_LINK_SECRET ?? "leaseai-share-secret";
      passwordHash = createHash("sha256")
        .update(password.trim() + secret)
        .digest("hex");
    }

    const token = generateShareToken();
    const expiresAtVal =
      typeof expiresAt === "string" && expiresAt
        ? new Date(expiresAt).toISOString()
        : null;

    const { data: link, error: insertError } = await supabase
      .from("share_links")
      .insert({
        organization_id: profile.organization_id,
        lease_id: leaseId,
        created_by: user.id,
        token,
        password_hash: passwordHash,
        expires_at: expiresAtVal,
        label: label?.trim() || null,
        allow_comments: !!allowComments,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Share link insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create share link" },
        { status: 500 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${link.token}`;

    return NextResponse.json({
      success: true,
      shareLink: { ...link, share_url: shareUrl },
    });
  } catch (err) {
    console.error("Share link create error:", err);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}

/** List share links for a lease. Query: leaseId */
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

    const { searchParams } = new URL(request.url);
    const leaseId = searchParams.get("leaseId");
    if (!leaseId) {
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
      return NextResponse.json({ shareLinks: [] });
    }

    const { data: lease } = await supabase
      .from("leases")
      .select("id")
      .eq("id", leaseId)
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (!lease) {
      return NextResponse.json({ shareLinks: [] });
    }

    const { data: shareLinks, error } = await supabase
      .from("share_links")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Share links fetch error:", error);
      return NextResponse.json({ shareLinks: [] });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const withUrls = (shareLinks ?? []).map((link) => ({
      ...link,
      share_url: `${baseUrl}/share/${link.token}`,
    }));

    return NextResponse.json({ shareLinks: withUrls });
  } catch (err) {
    console.error("Share links list error:", err);
    return NextResponse.json({ shareLinks: [] });
  }
}
