# Supabase migrations

These SQL files add or change tables in your **Supabase** project (dashboard lease data: organizations, profiles, leases, lease_analyses, lease_comments, etc.).

## Option A: Run from the command line

1. In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Settings** → **Database**, copy the **Connection string** (URI). Use Session mode (port 5432) or Transaction mode (port 6543) and include the password.
2. From the project root, run:
   ```bash
   SUPABASE_DB_URL='postgresql://postgres.[ref]:[YOUR-PASSWORD]@...' pnpm db:supabase-migrate
   ```
   Or add `SUPABASE_DB_URL` to `.env.local` and run:
   ```bash
   pnpm db:supabase-migrate
   ```

## Option B: Run in Supabase SQL Editor

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Paste the contents of the migration file (e.g. `0014_share_links_client_portal.sql`).
3. Click **Run**.

Run migrations in order by filename (e.g. `0014_...` before `0015_...`).

---

- `0014_share_links_client_portal.sql` – Client sharing portal (Broker plan): share_links, organization_branding, share_link_views, approval_workflows; lease_comments extended for client (guest) comments.
- `0015_templates_api_keys_webhooks.sql` – Template library (lease_templates, lease_template_versions), API keys (api_keys), webhooks (webhooks).