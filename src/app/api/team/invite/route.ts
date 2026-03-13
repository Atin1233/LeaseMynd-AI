// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get user's profile and check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 400 }
      );
    }

    // Ensure the user has an organization; if not, create one on the fly so
    // existing accounts (created before org provisioning) can still invite.
    let organizationId = profile.organization_id as string | null;

    if (!organizationId) {
      const defaultPlan =
        process.env.NODE_ENV === "development" ? "broker" : "free";
      const defaultLimit =
        defaultPlan === "broker" || defaultPlan === "free" ? -1 : 3;

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        // @ts-ignore - Supabase type inference issue with organizations table
        .insert({
          name: profile.full_name || profile.email || "My LeaseAI workspace",
          plan: defaultPlan,
          monthly_analysis_limit: defaultLimit,
        })
        .select()
        .single();

      if (orgError || !org) {
        console.error("Organization auto-create error:", orgError);
        return NextResponse.json(
          { error: "Failed to create organization for invites" },
          { status: 500 }
        );
      }

      organizationId = org.id;

      // Attach the newly created org to the profile and make them owner.
      await supabase
        .from("profiles")
        // @ts-ignore - Supabase type inference issue with profiles table
        .update({
          organization_id: org.id,
          role: profile.role || "owner",
        })
        .eq("id", user.id);
    }

    if (!["owner", "admin"].includes(profile.role || "")) {
      return NextResponse.json(
        { error: "Only admins and owners can invite team members" },
        { status: 403 }
      );
    }

    // Check if user is already in the organization
    const { data: existingMember, error: existingMemberError } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("email", email)
      .maybeSingle();

    if (!existingMemberError && existingMember) {
      return NextResponse.json(
        { error: "This user is already a member of your organization" },
        { status: 400 }
      );
    }

    // Check for existing pending invite
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from("team_invites")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!existingInviteError && existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 }
      );
    }

    // Check team size limits based on plan
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();
    
    if (orgError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { count: memberCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id);

    const planLimits: Record<string, number> = {
      free: 1,
      single: 1,
      team: 5,
      broker: 20,
    };

    const limit = planLimits[organization?.plan || "free"] || 1;

    if ((memberCount || 0) >= limit) {
      return NextResponse.json(
        { error: `Your plan allows up to ${limit} team members. Please upgrade to add more.` },
        { status: 400 }
      );
    }

    // Create invite
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .insert({
        organization_id: profile.organization_id,
        email,
        role,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      );
    }

    // Get inviter's name for email
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || "A team member";

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${token}`;

    // Send email notification (async - don't wait for it)
    import("~/lib/email/team-invite").then(({ sendTeamInviteEmail }) => {
      sendTeamInviteEmail({
        inviteEmail: email,
        inviterName,
        organizationName: organization.name,
        role,
        inviteLink,
        expiresInDays: 7,
      }).catch((err) => {
        console.error("Failed to send invite email:", err);
        // Don't fail the request if email fails
      });
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        link: inviteLink,
      },
      message: "Invitation sent! The team member will receive an email with the invitation link.",
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ invites: [] });
    }

    // Get pending invites
    const { data: invites } = await supabase
      .from("team_invites")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    return NextResponse.json({ invites: invites || [] });
  } catch (error) {
    console.error("Get invites error:", error);
    return NextResponse.json(
      { error: "Failed to get invites" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("id");

    if (!inviteId) {
      return NextResponse.json(
        { error: "Invite ID is required" },
        { status: 400 }
      );
    }

    // Get user's profile and check permissions
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || !["owner", "admin"].includes(profile.role || "")) {
      return NextResponse.json(
        { error: "Only admins and owners can cancel invites" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("team_invites")
      .delete()
      .eq("id", inviteId)
      .eq("organization_id", profile?.organization_id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to cancel invite" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete invite error:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}

