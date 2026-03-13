// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

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
      return NextResponse.json({ members: [] });
    }

    // Get all members in the organization
    const { data: members } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, avatar_url, created_at")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ members: members || [] });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to get team members" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json(
        { error: "Member ID and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get user's profile and check permissions
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError || !currentProfile || !["owner", "admin"].includes(currentProfile.role || "")) {
      return NextResponse.json(
        { error: "Only admins and owners can change roles" },
        { status: 403 }
      );
    }

    // Can't change own role if you're the owner
    if (memberId === user.id && currentProfile.role === "owner") {
      return NextResponse.json(
        { error: "Owners cannot change their own role" },
        { status: 400 }
      );
    }

    // Get target member
    const { data: targetMember, error: targetMemberError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();
    
    if (targetMemberError || !targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Can't change owner's role
    if (targetMember?.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner's role" },
        { status: 400 }
      );
    }

    // Check they're in the same organization
    if (targetMember?.organization_id !== currentProfile?.organization_id) {
      return NextResponse.json(
        { error: "Member not found in your organization" },
        { status: 404 }
      );
    }

    // Update role
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
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
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    // Get user's profile and check permissions
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfileError || !currentProfile || !["owner", "admin"].includes(currentProfile.role || "")) {
      return NextResponse.json(
        { error: "Only admins and owners can remove members" },
        { status: 403 }
      );
    }

    // Can't remove yourself
    if (memberId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    // Get target member
    const { data: targetMember, error: targetMemberError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", memberId)
      .maybeSingle();
    
    if (targetMemberError || !targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Can't remove owner
    if (targetMember?.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 400 }
      );
    }

    // Check they're in the same organization
    if (targetMember?.organization_id !== currentProfile?.organization_id) {
      return NextResponse.json(
        { error: "Member not found in your organization" },
        { status: 404 }
      );
    }

    // Remove from organization (set organization_id to null)
    const { error } = await supabase
      .from("profiles")
      .update({ organization_id: null, role: "member" })
      .eq("id", memberId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

