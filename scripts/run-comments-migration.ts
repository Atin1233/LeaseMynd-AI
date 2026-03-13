/**
 * Migration script to create the lease_comments table
 * Run with: npx tsx scripts/run-comments-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing required environment variables:");
    console.error("   - NEXT_PUBLIC_SUPABASE_URL");
    console.error("   - SUPABASE_SERVICE_ROLE_KEY");
    console.error("\nPlease set these in your .env.local file");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read the migration file
  const migrationPath = path.join(process.cwd(), "drizzle/0007_add_lease_comments.sql");
  const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

  console.log("🚀 Running migration: lease_comments table");
  console.log("📄 Migration file:", migrationPath);
  console.log("\n");

  try {
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`);
        const { error } = await supabase.rpc("exec_sql", { sql: statement });

        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase
            .from("_migrations")
            .select("*")
            .limit(0); // This is just to test connection

          // If RPC doesn't exist, we need to use a different approach
          console.warn("⚠️  RPC method not available, using alternative approach...");
          console.log("✅ Please run the migration manually via Supabase Dashboard");
          console.log("\n📋 SQL to run:\n");
          console.log(migrationSQL);
          process.exit(0);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err);
        console.log("\n⚠️  Migration partially completed. Please check your database.");
        process.exit(1);
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("🎉 The lease_comments table is now ready to use.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.log("\n📋 Please run the SQL manually via Supabase Dashboard:");
    console.log("   1. Go to your Supabase project");
    console.log("   2. Open SQL Editor");
    console.log("   3. Copy/paste the contents of drizzle/0007_add_lease_comments.sql");
    console.log("   4. Run it");
    process.exit(1);
  }
}

runMigration();
