-- Phase 1 auth: add Supabase user ID to employer/employee users table.
-- Allows lookup by Supabase session during Clerk → Supabase migration.
-- Existing rows keep userId (Clerk); new rows use supabase_user_id.

ALTER TABLE "pdr_ai_v2_users"
  ADD COLUMN IF NOT EXISTS "supabase_user_id" uuid NULL UNIQUE;

CREATE INDEX IF NOT EXISTS "users_supabase_user_id_idx"
  ON "pdr_ai_v2_users" ("supabase_user_id");
