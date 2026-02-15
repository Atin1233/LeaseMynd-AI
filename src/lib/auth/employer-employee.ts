/**
 * Employer/employee auth: Supabase Auth only.
 * Used by /api/employerAuth, /api/employeeAuth.
 */

import { db } from "~/server/db/index";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "~/lib/auth";
import type { User } from "~/server/db/schema";

export type EmployerEmployeeUser = User;

/**
 * Resolve employer/employee user from Supabase session.
 * Returns user row from pdr_ai_v2_users, or null if not found / not authenticated.
 */
export async function getEmployerEmployeeUser(): Promise<EmployerEmployeeUser | null> {
  const { user: supabaseUser } = await getCurrentUser();
  if (!supabaseUser?.id) return null;

  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUserId, supabaseUser.id));
  return row ?? null;
}
