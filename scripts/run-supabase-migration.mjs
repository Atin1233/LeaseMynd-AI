#!/usr/bin/env node
/**
 * Run Supabase SQL migrations (docs/supabase_migrations/*.sql) against your
 * Supabase Postgres database.
 *
 * Set SUPABASE_DB_URL to your Supabase project's "Connection string" (URI) from
 * Project Settings → Database. Use the "Session mode" (port 5432) or "Transaction"
 * connection string; include the password.
 *
 * Example: SUPABASE_DB_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
 *
 * Run: SUPABASE_DB_URL="..." node scripts/run-supabase-migration.mjs
 * Or: add SUPABASE_DB_URL to .env.local and run: node scripts/run-supabase-migration.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Load .env.local and .env if present (no dotenv dependency required for SUPABASE_DB_URL from env)
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: join(root, ".env.local") });
  dotenv.config({ path: join(root, ".env") });
} catch {
  // dotenv optional
}

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

const MIGRATION_FILE = "docs/supabase_migrations/0014_share_links_client_portal.sql";

/**
 * Split SQL into statements, keeping DO $$ ... END $$; as a single statement.
 */
function statementsFromSql(content) {
  const s = content.replace(/\r\n/g, "\n");
  const raw = s.split(/;\s*\n/).map((x) => x.trim()).filter((x) => x.length > 0 && !x.startsWith("--"));
  const out = [];
  let i = 0;
  while (i < raw.length) {
    let stmt = raw[i];
    if (stmt.startsWith("DO $$") || stmt.startsWith("DO\n$$")) {
      while (i < raw.length && !raw[i].includes("END $$")) {
        i++;
        if (i < raw.length) stmt += ";\n" + raw[i];
      }
      out.push(stmt);
      i++;
      continue;
    }
    out.push(stmt);
    i++;
  }
  return out;
}

async function main() {
  if (!SUPABASE_DB_URL) {
    console.error("SUPABASE_DB_URL is not set.");
    console.error("");
    console.error("1. Open Supabase Dashboard → your project → Settings → Database");
    console.error("2. Copy the 'Connection string' (URI), e.g. Session mode or Transaction mode");
    console.error("3. Run: SUPABASE_DB_URL='postgresql://...' node scripts/run-supabase-migration.mjs");
    console.error("");
    console.error("Alternatively, run the SQL manually:");
    console.error("  - Open Supabase Dashboard → SQL Editor");
    console.error("  - Paste the contents of " + MIGRATION_FILE);
    console.error("  - Click Run");
    process.exit(1);
  }

  const path = join(root, MIGRATION_FILE);
  if (!existsSync(path)) {
    console.error("Migration file not found: " + MIGRATION_FILE);
    process.exit(1);
  }

  const raw = readFileSync(path, "utf-8");
  const stmts = statementsFromSql(raw);
  console.log("Running " + stmts.length + " statement(s) from " + MIGRATION_FILE + " ...");

  const sql = postgres(SUPABASE_DB_URL, { max: 1 });
  let run = 0;
  let fail = 0;

  for (let i = 0; i < stmts.length; i++) {
    let stmt = stmts[i];
    if (!stmt.endsWith(";")) stmt += ";";
    try {
      await sql.unsafe(stmt);
      run++;
      console.log("  ✅ [" + (i + 1) + "/" + stmts.length + "]");
    } catch (e) {
      fail++;
      const msg = e?.message ?? String(e);
      console.error("  ❌ [" + (i + 1) + "/" + stmts.length + "] " + msg);
    }
  }

  await sql.end();

  if (fail > 0) {
    console.error("\n⚠️  " + fail + " statement(s) failed.");
    process.exit(1);
  }
  console.log("\n✅ Supabase migration complete (" + run + " statement(s)).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
