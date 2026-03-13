# Migrations & Supabase MCP

## Automatic migrations

Manual SQL migrations (`drizzle/0012_*`, `drizzle/0013_*`, etc.) run **automatically** when:

1. **Before every build:** `pnpm build` runs `prebuild` → `pnpm db:migrate:manual` first.
2. **CI:** Same; `pnpm build` in your pipeline runs migrations then builds.
3. **Explicit:** `pnpm db:migrate:manual` runs them on demand.

**Requirements:**

- `DATABASE_URL` in `.env.local` (or `.env`). Use your Supabase **Postgres** connection string (Settings → Database → Connection string → URI).
- If `DATABASE_URL` is missing, migrations are **skipped** (no error).

**IPv4-only networks (e.g. “Not IPv4 compatible” / `EHOSTUNREACH`):**  
Use the **Session pooler** (or **Transaction** pooler) URI from the same dialog (Connection string → **Method** → Session pooler). Copy that URI, replace `[YOUR-PASSWORD]`, set it as `DATABASE_URL`, then run `pnpm db:migrate:manual`. The pooler host is IPv4-friendly.

**What runs:**

- `scripts/run-migrations.mjs` executes each listed file in order via the `postgres` package.
- Migrations use `IF NOT EXISTS` / `IF EXISTS` where possible, so re-running is safe.

**Add more migrations:**

- Add new `drizzle/NNNN_description.sql` files.
- Append their paths to `MANUAL_MIGRATIONS` in `scripts/run-migrations.mjs`.

---

## Supabase MCP – run queries via Cursor

With [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp), the AI assistant can run SQL against your Supabase project (list tables, query data, etc.) through Cursor.

### 1. Project config (already added)

This repo includes `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

### 2. Connect in Cursor

1. **Restart Cursor** (or reload the window) so it picks up the MCP config.
2. Cursor will prompt you to **log in to Supabase** (browser). Sign in and grant access to the org/project you use for this app.
3. In Cursor: **Settings → Cursor Settings → Tools & MCP**. Confirm the `supabase` server is connected.

### 3. Use it

Ask the assistant to run queries in natural language, e.g.:

- “List tables in the database using MCP.”
- “Run `SELECT * FROM pdr_ai_v2_users LIMIT 5` via Supabase MCP.”

The assistant will use the Supabase MCP tools to run SQL against your project.

### 4. Optional: project-scoped & read-only

- **Project-scoped:** Use `https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF` so the MCP only sees that project.
- **Read-only:** See [Supabase MCP read-only mode](https://github.com/supabase-community/supabase-mcp#read-only-mode) to restrict to SELECTs.

### 5. User-level config (alternative)

If you prefer user-level MCP config instead of project-level:

1. Open `~/.cursor/mcp.json` (or Cursor’s config directory on your machine).
2. Add the `supabase` entry under `mcpServers` as above.
3. Restart Cursor and complete Supabase login when prompted.

---

## Summary

| Task | How |
|------|-----|
| Run manual migrations | `pnpm db:migrate:manual` or `pnpm build` (runs them first) |
| Run queries via AI | Use Supabase MCP in Cursor; ask to run SQL via MCP |
| Add new migration | Add SQL file under `drizzle/`, then add path to `run-migrations.mjs` |
