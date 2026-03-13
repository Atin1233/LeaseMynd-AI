/**
 * Development-only API endpoint to upgrade current organization to broker plan
 * This is useful for testing all features on localhost
 * 
 * Usage: POST /api/dev/upgrade-to-broker
 */
// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    // Upgrade to broker plan
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        plan: "broker",
        monthly_analysis_limit: -1, // Unlimited
        analyses_used_this_month: 0, // Reset usage
      })
      .eq("id", profile.organization_id);

    if (updateError) {
      console.error("Upgrade error:", updateError);
      return NextResponse.json(
        { error: "Failed to upgrade organization" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Organization upgraded to Broker plan (all features enabled)",
      plan: "broker",
      limits: {
        analysesPerMonth: -1, // Unlimited
        teamMembers: 20,
        apiAccess: true,
        whiteLabel: true,
      },
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return NextResponse.json(
      { error: "Failed to upgrade organization" },
      { status: 500 }
    );
  }
}
