// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { getMarketBenchmark, compareToMarket, type LeaseTerms } from "~/lib/lease-analysis/market-comparison";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MarketComparisonRequest {
  leaseId: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: MarketComparisonRequest = await request.json();
    const { leaseId } = body;

    if (!leaseId || typeof leaseId !== "string") {
      return NextResponse.json(
        { error: "leaseId is required" },
        { status: 400 }
      );
    }

    // Fetch lease and verify ownership
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("*, organization_id")
      .eq("id", leaseId)
      .maybeSingle();

    if (leaseError || !lease) {
      return NextResponse.json({ error: "Lease not found" }, { status: 404 });
    }

    // Verify user belongs to the lease's organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.organization_id !== lease.organization_id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get the latest analysis
    const { data: analysis, error: analysisError } = await supabase
      .from("lease_analyses")
      .select("*")
      .eq("lease_id", leaseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found. Please analyze the lease first." },
        { status: 404 }
      );
    }

    // Extract property details from analysis metadata or lease
    const propertyType = (analysis.analysis_metadata as any)?.propertyDetails?.property_type || 
                        lease.property_type;
    const propertyAddress = (analysis.analysis_metadata as any)?.propertyDetails?.address || 
                           lease.property_address;

    // Extract region from address
    let region = null;
    if (propertyAddress) {
      const match = propertyAddress.match(/([A-Za-z\s]+),\s*([A-Z]{2})/);
      if (match) {
        region = `${match[1].trim()}, ${match[2]}`;
      }
    }

    // Get market benchmark
    const benchmark = await getMarketBenchmark(region, propertyType);

    if (!benchmark) {
      return NextResponse.json(
        { 
          error: "Market benchmark not available",
          message: "No market data available for this region and property type. We're working on expanding our database."
        },
        { status: 404 }
      );
    }

    // Extract financial terms from analysis
    const propertyDetails = (analysis.analysis_metadata as any)?.propertyDetails || {};
    
    // Helper function to extract numeric value from string
    const extractNumber = (str: string | undefined): number | undefined => {
      if (!str) return undefined;
      const match = str.toString().replace(/[,$]/g, '').match(/(\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : undefined;
    };

    // Extract square footage
    const squareFootage = extractNumber(propertyDetails.square_footage as string) || 
                          extractNumber(propertyDetails.square_footage?.toString());

    // Extract base rent
    const baseRentStr = propertyDetails.base_rent as string || propertyDetails.monthly_rent as string;
    const baseRent = extractNumber(baseRentStr);

    // Calculate rent per SF
    let rentPerSf: number | undefined;
    if (baseRent && squareFootage) {
      const annualRent = baseRent < 50000 ? baseRent * 12 : baseRent;
      rentPerSf = annualRent / squareFootage;
    }

    // Extract TI allowance
    const tiAllowanceStr = propertyDetails.tenant_improvement_allowance as string;
    const tiAllowance = extractNumber(tiAllowanceStr);
    const tiAllowancePerSf = tiAllowance && squareFootage ? tiAllowance / squareFootage : undefined;

    // Extract security deposit
    const securityDepositStr = propertyDetails.security_deposit as string;
    const securityDeposit = extractNumber(securityDepositStr);
    const monthlyRent = baseRent && baseRent < 50000 ? baseRent : (baseRent ? baseRent / 12 : undefined);
    const securityDepositMonths = securityDeposit && monthlyRent ? securityDeposit / monthlyRent : undefined;

    // Extract lease term
    const leaseTermStr = propertyDetails.lease_term as string;
    let leaseTermMonths: number | undefined;
    if (leaseTermStr) {
      const yearsMatch = leaseTermStr.match(/(\d+)\s*years?/i);
      const monthsMatch = leaseTermStr.match(/(\d+)\s*months?/i);
      if (yearsMatch) {
        leaseTermMonths = parseInt(yearsMatch[1]) * 12;
      } else if (monthsMatch) {
        leaseTermMonths = parseInt(monthsMatch[1]);
      }
    }

    // Extract annual escalation
    const escalationStr = propertyDetails.rent_escalation as string;
    let annualEscalation: number | undefined;
    if (escalationStr) {
      const percentMatch = escalationStr.match(/(\d+\.?\d*)\s*%/i);
      if (percentMatch) {
        annualEscalation = parseFloat(percentMatch[1]);
      }
    }

    // Extract free rent months
    const freeRentStr = propertyDetails.free_rent as string;
    let freeRentMonths: number | undefined;
    if (freeRentStr) {
      const monthsMatch = freeRentStr.match(/(\d+)\s*months?/i);
      if (monthsMatch) {
        freeRentMonths = parseInt(monthsMatch[1]);
      }
    }

    // Extract CAM
    let camPerSf: number | undefined;
    const camClause = (analysis.analysis_metadata as any)?.clauses?.find(
      (c: any) => 
        c.clause_type?.toLowerCase().includes("cam") ||
        c.clause_type?.toLowerCase().includes("common area")
    );
    if (camClause?.original_text && squareFootage) {
      const camValue = extractNumber(camClause.original_text);
      if (camValue) {
        const isAnnual = camClause.original_text.toLowerCase().includes("annual") || 
                       camClause.original_text.toLowerCase().includes("year");
        const annualCam = isAnnual ? camValue : camValue * 12;
        camPerSf = annualCam / squareFootage;
      }
    }

    // Extract protective clauses from analysis
    const clauses = (analysis.analysis_metadata as any)?.clauses || [];
    const hasRenewalOption = clauses.some(
      (c: any) => 
        c.clause_type?.toLowerCase().includes("renewal") && 
        !c.original_text?.toLowerCase().includes("no renewal") &&
        !c.original_text?.toLowerCase().includes("no option")
    );

    const hasEarlyTermination = clauses.some(
      (c: any) => 
        c.clause_type?.toLowerCase().includes("early termination") ||
        c.clause_type?.toLowerCase().includes("termination right")
    );

    const hasPersonalGuarantee = clauses.some(
      (c: any) => 
        c.clause_type?.toLowerCase().includes("personal guarantee") ||
        c.original_text?.toLowerCase().includes("personal guarantee")
    );

    // Build lease terms object
    const leaseTerms: LeaseTerms = {
      rentPerSf,
      camPerSf,
      tiAllowancePerSf,
      leaseTermMonths,
      annualEscalation,
      freeRentMonths,
      securityDepositMonths,
      hasRenewalOption,
      hasEarlyTermination,
      hasPersonalGuarantee,
    };

    // Generate market comparison
    const marketComparison = compareToMarket(leaseTerms, benchmark);

    // Update the analysis with new market comparison
    const { error: updateError } = await supabase
      .from("lease_analyses")
      .update({
        market_comparison: marketComparison,
      })
      .eq("id", analysis.id);

    if (updateError) {
      console.error("Failed to update market comparison:", updateError);
      return NextResponse.json(
        { error: "Failed to save market comparison" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      marketComparison,
    });
  } catch (error) {
    console.error("Market comparison error:", error);
    return NextResponse.json(
      { error: "Failed to generate market comparison" },
      { status: 500 }
    );
  }
}
