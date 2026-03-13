// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

/**
 * Admin API route to seed market benchmark data
 * POST /api/admin/seed-benchmarks
 * 
 * This endpoint populates the market_benchmarks table with sample data.
 * For production, this should be protected with admin authentication.
 */

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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication (basic - enhance with admin check in production)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { clearExisting = false } = await request.json().catch(() => ({}));

    // Clear existing data if requested
    if (clearExisting) {
      const { error: deleteError } = await supabase
        .from("market_benchmarks")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) {
        console.warn("Warning: Could not clear existing data:", deleteError);
      }
    }

    // Insert benchmarks
    const { data, error } = await supabase
      .from("market_benchmarks")
      // @ts-expect-error - Supabase type inference issue with market_benchmarks insert
      .insert(benchmarks)
      .select();

    if (error) {
      console.error("Failed to seed benchmarks:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to seed benchmarks",
          details: error.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${data?.length || benchmarks.length} market benchmarks`,
      count: data?.length || benchmarks.length,
    });
  } catch (error) {
    console.error("Seed benchmarks error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to seed benchmarks",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
