// @ts-nocheck - Supabase type inference issues
import { requireAuth } from "~/lib/auth";
import { DashboardShell } from "./_components/DashboardShell";
import { MfaGate } from "./_components/MfaGate";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, supabase } = await requireAuth();

  // Get user profile (fetch separately to avoid RLS join recursion)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile in dashboard layout:", profileError);
  }

  // Fetch organization separately if exists
  let organization = null;
  if (profile?.organization_id) {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();
    
    if (orgError) {
      console.error("Error fetching organization in dashboard layout:", orgError);
    }
    organization = org;

    // Auto-upgrade to broker plan on localhost/development
    if (
      org &&
      org.plan !== "broker" &&
      (process.env.NODE_ENV === "development" ||
        process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ||
        process.env.NEXT_PUBLIC_APP_URL?.includes("127.0.0.1"))
    ) {
      // Silently upgrade to broker plan in development using admin client
      const { createAdminClient } = await import("~/lib/supabase/server");
      const adminSupabase = await createAdminClient();
      
      await adminSupabase
        .from("organizations")
        .update({
          plan: "broker",
          monthly_analysis_limit: -1, // Unlimited
        })
        .eq("id", org.id);

      // Update the organization object for this request
      organization = {
        ...org,
        plan: "broker" as const,
        monthly_analysis_limit: -1,
      };
    }
  }

  return (
    <DashboardShell
      user={user}
      profile={profile ? { ...profile, organizations: organization } : null}
    >
      <MfaGate>{children}</MfaGate>
    </DashboardShell>
  );
}

