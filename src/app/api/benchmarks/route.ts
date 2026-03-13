// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const propertyType = searchParams.get("propertyType");

    let query = supabase.from("market_benchmarks").select("*");

    if (region) {
      query = query.eq("region", region);
    }

    if (propertyType) {
      query = query.eq("property_type", propertyType);
    }

    const { data: benchmarks, error } = await query.order("region");

    if (error) {
      console.error("Benchmark error:", error);
      return NextResponse.json(
        { error: "Failed to fetch benchmarks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ benchmarks });
  } catch (error) {
    console.error("Benchmark error:", error);
    return NextResponse.json(
      { error: "Failed to fetch benchmarks" },
      { status: 500 }
    );
  }
}

// Get available regions
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === "getRegions") {
      const { data } = await supabase
        .from("market_benchmarks")
        .select("region")
        .order("region");

      // @ts-expect-error - Supabase type inference issue with market_benchmarks
      const regions = [...new Set(data?.map((d) => d.region) || [])];
      return NextResponse.json({ regions });
    }

    if (action === "getPropertyTypes") {
      const { data } = await supabase
        .from("market_benchmarks")
        .select("property_type")
        .order("property_type");

      // @ts-expect-error - Supabase type inference issue with market_benchmarks
      const propertyTypes = [...new Set(data?.map((d) => d.property_type) || [])];
      return NextResponse.json({ propertyTypes });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Benchmark error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

