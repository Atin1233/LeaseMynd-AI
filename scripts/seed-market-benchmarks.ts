/**
 * Seed script for market benchmark data
 * Run with: npx tsx scripts/seed-market-benchmarks.ts
 * 
 * This script populates the market_benchmarks table with sample data
 * for different regions and property types.
 */

import { createClient } from "@supabase/supabase-js";

// Market benchmark data based on 2024-2025 commercial real estate averages
const benchmarks = [
  // National Averages - Office
  {
    region: "National Average",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 45.50,
    avg_cam_per_sf: 12.30,
    avg_ti_allowance_per_sf: 55.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.2,
    avg_free_rent_months: 2.5,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 12500,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "National Average",
    property_type: "office",
    building_class: "B",
    avg_rent_per_sf: 32.80,
    avg_cam_per_sf: 10.50,
    avg_ti_allowance_per_sf: 35.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.0,
    avg_free_rent_months: 2.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 18500,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "National Average",
    property_type: "office",
    building_class: "C",
    avg_rent_per_sf: 22.40,
    avg_cam_per_sf: 8.20,
    avg_ti_allowance_per_sf: 20.00,
    avg_lease_term_months: 36,
    avg_annual_escalation: 2.8,
    avg_free_rent_months: 1.5,
    avg_security_deposit_months: 1.5,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: false,
    sample_size: 9800,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },

  // Major Markets - Office
  {
    region: "New York, NY",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 78.50,
    avg_cam_per_sf: 18.20,
    avg_ti_allowance_per_sf: 85.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.5,
    avg_free_rent_months: 3.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 3200,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "San Francisco, CA",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 72.30,
    avg_cam_per_sf: 16.80,
    avg_ti_allowance_per_sf: 90.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.2,
    avg_free_rent_months: 2.5,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 2100,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "Los Angeles, CA",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 48.90,
    avg_cam_per_sf: 14.50,
    avg_ti_allowance_per_sf: 60.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.0,
    avg_free_rent_months: 2.5,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 2800,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "Chicago, IL",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 38.20,
    avg_cam_per_sf: 13.20,
    avg_ti_allowance_per_sf: 50.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.0,
    avg_free_rent_months: 2.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 1900,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "Dallas, TX",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 32.50,
    avg_cam_per_sf: 11.80,
    avg_ti_allowance_per_sf: 45.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 2.8,
    avg_free_rent_months: 2.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 1500,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "Atlanta, GA",
    property_type: "office",
    building_class: "A",
    avg_rent_per_sf: 28.90,
    avg_cam_per_sf: 10.50,
    avg_ti_allowance_per_sf: 40.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 2.8,
    avg_free_rent_months: 2.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 1200,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },

  // Retail
  {
    region: "National Average",
    property_type: "retail",
    building_class: null,
    avg_rent_per_sf: 22.50,
    avg_cam_per_sf: 8.50,
    avg_ti_allowance_per_sf: 30.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 2.5,
    avg_free_rent_months: 2.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 8500,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },

  // Industrial/Warehouse
  {
    region: "National Average",
    property_type: "industrial",
    building_class: null,
    avg_rent_per_sf: 8.20,
    avg_cam_per_sf: 2.50,
    avg_ti_allowance_per_sf: 5.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 2.5,
    avg_free_rent_months: 1.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 6200,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
  {
    region: "National Average",
    property_type: "warehouse",
    building_class: null,
    avg_rent_per_sf: 7.80,
    avg_cam_per_sf: 2.30,
    avg_ti_allowance_per_sf: 4.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 2.5,
    avg_free_rent_months: 1.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 4800,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },

  // Medical
  {
    region: "National Average",
    property_type: "medical",
    building_class: null,
    avg_rent_per_sf: 28.50,
    avg_cam_per_sf: 11.20,
    avg_ti_allowance_per_sf: 65.00,
    avg_lease_term_months: 60,
    avg_annual_escalation: 3.0,
    avg_free_rent_months: 2.0,
    avg_security_deposit_months: 2.0,
    personal_guarantee_common: true,
    early_termination_common: false,
    renewal_option_common: true,
    sample_size: 2100,
    data_source: "Industry Standard",
    effective_date: new Date().toISOString().split("T")[0],
  },
];

async function seedBenchmarks() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase environment variables:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
    console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("🌱 Seeding market benchmarks...");
  console.log(`   Found ${benchmarks.length} benchmark records to insert\n`);

  // Clear existing data (optional - comment out if you want to keep existing)
  console.log("🗑️  Clearing existing benchmarks...");
  const { error: deleteError } = await supabase
    .from("market_benchmarks")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

  if (deleteError) {
    console.warn("⚠️  Warning: Could not clear existing data:", deleteError.message);
  } else {
    console.log("   ✓ Cleared existing benchmarks\n");
  }

  // Insert benchmarks
  let successCount = 0;
  let errorCount = 0;

  for (const benchmark of benchmarks) {
    const { data, error } = await supabase
      .from("market_benchmarks")
      .insert(benchmark)
      .select();

    if (error) {
      console.error(`❌ Failed to insert ${benchmark.region} - ${benchmark.property_type}:`, error.message);
      errorCount++;
    } else {
      console.log(`✓ Inserted: ${benchmark.region} - ${benchmark.property_type}${benchmark.building_class ? ` (Class ${benchmark.building_class})` : ""}`);
      successCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Seeding complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log("=".repeat(50));
}

// Run the seed function
seedBenchmarks()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
