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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Find the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select(
        `
        *,
        organization:organizations(
          id,
          name
        ),
        inviter:profiles!team_invites_invited_by_fkey(
          id,
          full_name,
          email
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

    // Check if user email matches invite email
    if (user.email !== invite.email) {
      return NextResponse.json(
        {
          error:
            "This invitation was sent to a different email address. Please sign in with the email that received the invitation.",
        },
        { status: 403 }
      );
    }

    // Check if user already has an organization
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile?.organization_id) {
      // User already has an organization - they can't accept this invite
      // (In the future, we might support multiple organizations)
      return NextResponse.json(
        {
          error:
            "You already belong to an organization. Please leave your current organization first.",
        },
        { status: 400 }
      );
    }

    // Update user's profile to join the organization
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        organization_id: invite.organization_id,
        role: invite.role,
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      return NextResponse.json(
        { error: "Failed to join organization" },
        { status: 500 }
      );
    }

    // Mark invite as accepted
    const { error: acceptError } = await supabase
      .from("team_invites")
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (acceptError) {
      console.error("Invite accept error:", acceptError);
      // Don't fail the whole operation if this fails - user is already added
    }

    return NextResponse.json({
      success: true,
      invite: {
        organizationName: invite.organization?.name || "the organization",
        inviterName:
          invite.inviter?.full_name || invite.inviter?.email || "a team member",
        role: invite.role,
      },
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
