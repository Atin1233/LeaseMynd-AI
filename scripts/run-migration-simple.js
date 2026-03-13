/**
 * Simple migration runner using Supabase client
 * Run with: node scripts/run-migration-simple.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  // Load environment variables
  require("dotenv").config({ path: ".env.local" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    console.error("   Required: NEXT_PUBLIC_SUPABASE_URL");
    console.error("   Required: SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration file
  const migrationPath = path.join(__dirname, "../drizzle/0007_add_lease_comments.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  console.log("🚀 Running migration: lease_comments table\n");

  // Since Supabase JS client doesn't support raw SQL execution,
  // we'll provide instructions to run it manually
  console.log("📋 To run this migration, please use one of these methods:\n");
  
  console.log("METHOD 1: Supabase Dashboard (Recommended)");
  console.log("   1. Go to: https://supabase.com/dashboard");
  console.log("   2. Select your project");
  console.log("   3. Click 'SQL Editor' in the left sidebar");
  console.log("   4. Click 'New query'");
  console.log("   5. Copy and paste the following SQL:\n");
  console.log("─".repeat(70));
  console.log(migrationSQL);
  console.log("─".repeat(70));
  console.log("\n   6. Click 'Run' to execute\n");

  console.log("METHOD 2: Supabase CLI");
  console.log("   If you have Supabase CLI installed:");
  console.log("   supabase db push\n");

  console.log("METHOD 3: Direct psql connection");
  console.log("   psql <your-connection-string> < drizzle/0007_add_lease_comments.sql\n");

  // Try to verify the table doesn't exist yet
  try {
    const { data, error } = await supabase
      .from("lease_comments")
      .select("id")
      .limit(1);

    if (!error) {
      console.log("✅ Table 'lease_comments' already exists!");
      console.log("   Migration may have already been run.\n");
    }
  } catch (err) {
    console.log("ℹ️  Table 'lease_comments' does not exist yet.");
    console.log("   Please run the migration using one of the methods above.\n");
  }
}

runMigration().catch(console.error);
