/**
 * Execute the lease_comments migration via Supabase REST API
 * Usage: node scripts/execute-migration.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local");
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  console.error("   This is required to execute migrations.");
  console.error("   You can find it in: Supabase Dashboard > Project Settings > API");
  process.exit(1);
}

// Read migration file
const migrationPath = join(__dirname, "../drizzle/0007_add_lease_comments.sql");
const migrationSQL = readFileSync(migrationPath, "utf-8");

console.log("🚀 Executing migration: lease_comments table\n");
console.log("📄 Migration file:", migrationPath);
console.log("🔗 Supabase URL:", supabaseUrl);
console.log("");

// Split SQL into statements (remove comments and empty lines)
const statements = migrationSQL
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--") && !s.match(/^\s*$/));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

// Execute each statement via Supabase REST API
let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i];
  if (!statement) continue;

  try {
    console.log(`[${i + 1}/${statements.length}] Executing...`);
    
    // Use Supabase REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ sql: statement }),
    });

    if (!response.ok) {
      // Try alternative: direct query endpoint
      const altResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ query: statement }),
      });

      if (!altResponse.ok) {
        throw new Error(`HTTP ${altResponse.status}: ${await altResponse.text()}`);
      }
    }

    successCount++;
    console.log(`✅ Statement ${i + 1} executed successfully\n`);
  } catch (error) {
    errorCount++;
    console.error(`❌ Error executing statement ${i + 1}:`, error.message);
    console.log(`\nStatement was:\n${statement.substring(0, 100)}...\n`);
  }
}

if (errorCount > 0) {
  console.log(`\n⚠️  Migration completed with ${errorCount} error(s)`);
  console.log("   Some statements may have failed. Please check your database.");
  console.log("\n📋 If errors occurred, please run the migration manually:");
  console.log("   1. Go to Supabase Dashboard > SQL Editor");
  console.log("   2. Copy/paste the SQL from: drizzle/0007_add_lease_comments.sql");
  console.log("   3. Run it manually\n");
  process.exit(1);
} else {
  console.log(`\n✅ Migration completed successfully!`);
  console.log(`   ${successCount} statements executed`);
  console.log("🎉 The lease_comments table is now ready to use.\n");
}
