#!/usr/bin/env node
/**
 * Run manual SQL migrations (drizzle/*.sql) that aren't in drizzle-kit's journal.
 * Uses DATABASE_URL from .env.local. Safe to re-run (migrations use IF NOT EXISTS etc.).
 *
 * Run: pnpm db:migrate:manual
 * Or automatically before build (prebuild) when DATABASE_URL is set.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
config({ path: join(root, ".env.local") });
config({ path: join(root, ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

const MANUAL_MIGRATIONS = [
  "drizzle/0012_google_embeddings_768.sql",
  "drizzle/0013_add_supabase_user_id_to_users.sql",
];

function statementsFromSql(content) {
  return content
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const CONNECT_TIMEOUT_MS = 5000;

async function main() {
  if (!DATABASE_URL) {
    console.log("⏭️  DATABASE_URL not set; skipping manual migrations.");
    process.exit(0);
  }

  const sql = postgres(DATABASE_URL, { max: 1 });
  let run = 0;
  let fail = 0;

  // Fast-fail: try one simple query with timeout so build doesn't hang on unreachable DB
  try {
    await Promise.race([
      sql`SELECT 1`,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error("CONNECT_TIMEOUT")), CONNECT_TIMEOUT_MS)
      ),
    ]);
  } catch (e) {
    const msg = e?.message ?? String(e);
    if (msg.includes("CONNECT_TIMEOUT") || msg.includes("EHOSTUNREACH") || msg.includes("ECONNREFUSED")) {
      console.log("⏭️  Database unreachable or timeout; skipping manual migrations. Run pnpm db:migrate:manual when DB is available.");
      await sql.end();
      process.exit(0);
    }
    throw e;
  }

  for (const rel of MANUAL_MIGRATIONS) {
    const path = join(root, rel);
    if (!existsSync(path)) {
      console.log(`⏭️  Skip ${rel} (file not found)`);
      continue;
    }
    const raw = readFileSync(path, "utf-8");
    const stmts = statementsFromSql(raw);
    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i];
      if (!stmt) continue;
      try {
        await sql.unsafe(stmt + ";");
        run++;
        console.log(`✅ ${rel} [${i + 1}/${stmts.length}]`);
      } catch (e) {
        fail++;
        const msg = e?.message ?? String(e);
        console.error(`❌ ${rel} [${i + 1}/${stmts.length}]: ${msg}`);
        if (msg.includes("Tenant or user not found") || msg.includes("EHOSTUNREACH")) {
          console.log("   (Connection issue – migrations may already be applied. Build will continue.)");
        }
      }
    }
  }

  await sql.end();

  if (fail > 0) {
    const connError = fail > 0; // could check if all failures were connection-related
    console.error(`\n⚠️  ${fail} statement(s) failed.`);
    if (process.env.CI !== "true") {
      console.log("   Build will continue. Run pnpm db:migrate:manual when DB is reachable.");
      process.exit(0);
    }
    process.exit(1);
  }
  if (run > 0) {
    console.log(`\n✅ Manual migrations done (${run} statement(s)).`);
  } else {
    console.log("\n✅ No manual migrations to run.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
