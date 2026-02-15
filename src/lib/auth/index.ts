/**
 * Unified auth utilities – Supabase Auth only.
 * Used by dashboard/lease flows now; employer/employee will migrate in Phase 1.
 */

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "~/lib/supabase/server";

export type { User };

export type AuthResult = {
  user: User | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/**
 * Get current Supabase user and client. No redirect.
 * Use in API routes or when you need optional auth.
 */
export async function getCurrentUser(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}

/**
 * Require auth for server components/layouts. Redirects to /login if unauthenticated.
 * Returns { user, supabase } so you can reuse the client for profile/org fetches.
 */
export async function requireAuth(): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const { user, supabase } = await getCurrentUser();
  if (!user) redirect("/login");
  return { user, supabase };
}
