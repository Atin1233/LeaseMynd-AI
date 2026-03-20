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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 }
      );
    }

    // Determine plan based on environment
    const isLocalhost =
      process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ||
      process.env.NEXT_PUBLIC_APP_URL?.includes("127.0.0.1");
    const defaultPlan = isLocalhost ? "broker" : "single";
    const defaultLimit = defaultPlan === "broker" ? -1 : 5;

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name,
        plan: defaultPlan,
        monthly_analysis_limit: defaultLimit,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization: " + orgError.message },
        { status: 500 }
      );
    }

    // Update profile with organization
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        organization_id: org.id,
        role: "owner",
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail - organization was created
    }

    return NextResponse.json({ success: true, organization: org });
  } catch (error) {
    console.error("Organization API error:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
