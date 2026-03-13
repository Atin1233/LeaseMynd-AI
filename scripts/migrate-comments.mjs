/**
 * Run the lease_comments migration
 * Usage: node scripts/migrate-comments.mjs
 */

import { createClient } from "@supabase/supabase-js";
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
  console.error("   Using anon key instead (may have permission issues)...");
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Read migration file
const migrationPath = join(__dirname, "../drizzle/0007_add_lease_comments.sql");
const migrationSQL = readFileSync(migrationPath, "utf-8");

console.log("🚀 Running migration: lease_comments table\n");
console.log("📄 Migration file:", migrationPath);
console.log("🔗 Supabase URL:", supabaseUrl);
console.log("");

// Since Supabase JS client doesn't support executing raw SQL directly,
// we need to use the REST API or provide manual instructions
console.log("⚠️  Supabase JS client cannot execute raw SQL directly.");
console.log("   Please run this migration using one of these methods:\n");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("METHOD 1: Supabase Dashboard (Easiest)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("1. Go to: https://supabase.com/dashboard");
console.log("2. Select your project");
console.log("3. Click 'SQL Editor' in the left sidebar");
console.log("4. Click 'New query'");
console.log("5. Copy and paste the SQL below:");
console.log("");
console.log("─".repeat(70));
console.log(migrationSQL);
console.log("─".repeat(70));
console.log("");
console.log("6. Click 'Run' (or press Cmd/Ctrl + Enter)");
console.log("7. Verify the table was created successfully\n");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("METHOD 2: Using psql (if you have direct database access)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("psql <your-connection-string> < drizzle/0007_add_lease_comments.sql\n");

// Try to check if table already exists
try {
  const { error } = await supabase.from("lease_comments").select("id").limit(0);
  
  if (!error) {
    console.log("✅ Table 'lease_comments' already exists!");
    console.log("   Migration appears to have been run already.\n");
  }
} catch (err) {
  // Table doesn't exist, which is expected
  console.log("ℹ️  Table 'lease_comments' does not exist yet.");
  console.log("   Please run the migration using Method 1 above.\n");
}

console.log("💡 Tip: After running the migration, the comment system will be fully functional!");
