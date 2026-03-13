// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select(
        `
        *,
        organization:organizations(
          id,
          name
        )
      `
      )
      .eq("token", token)
      .is("accepted_at", null)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        organizationName: invite.organization?.name || "the organization",
        role: invite.role,
      },
    });
  } catch (error) {
    console.error("Get invite info error:", error);
    return NextResponse.json(
      { error: "Failed to get invitation details" },
      { status: 500 }
    );
  }
}
