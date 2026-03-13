import { createClient } from "~/lib/supabase/server";

export interface MarketBenchmark {
  region: string;
  property_type: string;
  building_class: string | null;
  avg_rent_per_sf: number | null;
  avg_cam_per_sf: number | null;
  avg_ti_allowance_per_sf: number | null;
  avg_lease_term_months: number | null;
  avg_annual_escalation: number | null;
  avg_free_rent_months: number | null;
  avg_security_deposit_months: number | null;
  personal_guarantee_common: boolean;
  early_termination_common: boolean;
  renewal_option_common: boolean;
  sample_size: number | null;
}

export interface LeaseTerms {
  rentPerSf?: number;
  camPerSf?: number;
  tiAllowancePerSf?: number;
  leaseTermMonths?: number;
  annualEscalation?: number;
  freeRentMonths?: number;
  securityDepositMonths?: number;
  hasPersonalGuarantee?: boolean;
  hasEarlyTermination?: boolean;
  hasRenewalOption?: boolean;
}

export interface MarketComparison {
  benchmark: MarketBenchmark;
  comparisons: {
    metric: string;
    label: string;
    yourValue: string;
    marketValue: string;
    difference: string;
    differencePercent: number;
    status: "favorable" | "unfavorable" | "neutral";
    explanation: string;
  }[];
  overallAssessment: string;
  savingsOpportunities: string[];
}

export async function getMarketBenchmark(
  region: string | null,
  propertyType: string | null
): Promise<MarketBenchmark | null> {
  const supabase = await createClient();

  // Try to find exact match first
  if (region && propertyType) {
    const { data: exactMatch, error: exactError } = await supabase
      .from("market_benchmarks")
      .select("*")
      .ilike("region", `%${region}%`)
      .eq("property_type", propertyType)
      .limit(1)
      .maybeSingle();

    if (!exactError && exactMatch) return exactMatch as MarketBenchmark;
  }

  // Fall back to national average for property type
  if (propertyType) {
    const { data: nationalMatch, error: nationalError } = await supabase
      .from("market_benchmarks")
      .select("*")
      .eq("region", "National Average")
      .eq("property_type", propertyType)
      .limit(1)
      .maybeSingle();

    if (!nationalError && nationalMatch) return nationalMatch as MarketBenchmark;
  }

  // Fall back to national office average
  const { data: fallback, error: fallbackError } = await supabase
    .from("market_benchmarks")
    .select("*")
    .eq("region", "National Average")
    .eq("property_type", "office")
    .eq("building_class", "B")
    .limit(1)
    .maybeSingle();

  if (!fallbackError && fallback) return fallback as MarketBenchmark;

  return null;
}

export function compareToMarket(
  leaseTerms: LeaseTerms,
  benchmark: MarketBenchmark
): MarketComparison {
  const comparisons: MarketComparison["comparisons"] = [];

  // Rent comparison
  if (leaseTerms.rentPerSf !== undefined && benchmark.avg_rent_per_sf) {
    const diff = leaseTerms.rentPerSf - benchmark.avg_rent_per_sf;
    const diffPercent = (diff / benchmark.avg_rent_per_sf) * 100;
    comparisons.push({
      metric: "rent",
      label: "Base Rent (per SF)",
      yourValue: `$${leaseTerms.rentPerSf.toFixed(2)}`,
      marketValue: `$${benchmark.avg_rent_per_sf.toFixed(2)}`,
      difference: `${diff > 0 ? "+" : ""}$${diff.toFixed(2)}`,
      differencePercent: diffPercent,
      status: diff < 0 ? "favorable" : diff > 0 ? "unfavorable" : "neutral",
      explanation:
        diff < 0
          ? `Your rent is ${Math.abs(diffPercent).toFixed(1)}% below market average - excellent deal!`
          : diff > 0
            ? `Your rent is ${diffPercent.toFixed(1)}% above market average. Consider negotiating.`
            : "Your rent matches market average.",
    });
  }

  // CAM comparison
  if (leaseTerms.camPerSf !== undefined && benchmark.avg_cam_per_sf) {
    const diff = leaseTerms.camPerSf - benchmark.avg_cam_per_sf;
    const diffPercent = (diff / benchmark.avg_cam_per_sf) * 100;
    comparisons.push({
      metric: "cam",
      label: "CAM Charges (per SF)",
      yourValue: `$${leaseTerms.camPerSf.toFixed(2)}`,
      marketValue: `$${benchmark.avg_cam_per_sf.toFixed(2)}`,
      difference: `${diff > 0 ? "+" : ""}$${diff.toFixed(2)}`,
      differencePercent: diffPercent,
      status: diff < 0 ? "favorable" : diff > 0 ? "unfavorable" : "neutral",
      explanation:
        diff < 0
          ? `CAM charges ${Math.abs(diffPercent).toFixed(1)}% below average.`
          : diff > 0
            ? `CAM charges ${diffPercent.toFixed(1)}% above average. Review what's included.`
            : "CAM charges at market rate.",
    });
  }

  // TI Allowance comparison
  if (leaseTerms.tiAllowancePerSf !== undefined && benchmark.avg_ti_allowance_per_sf) {
    const diff = leaseTerms.tiAllowancePerSf - benchmark.avg_ti_allowance_per_sf;
    const diffPercent = (diff / benchmark.avg_ti_allowance_per_sf) * 100;
    comparisons.push({
      metric: "ti",
      label: "TI Allowance (per SF)",
      yourValue: `$${leaseTerms.tiAllowancePerSf.toFixed(2)}`,
      marketValue: `$${benchmark.avg_ti_allowance_per_sf.toFixed(2)}`,
      difference: `${diff > 0 ? "+" : ""}$${diff.toFixed(2)}`,
      differencePercent: diffPercent,
      status: diff > 0 ? "favorable" : diff < 0 ? "unfavorable" : "neutral",
      explanation:
        diff > 0
          ? `TI allowance ${diffPercent.toFixed(1)}% above market - great for buildout!`
          : diff < 0
            ? `TI allowance ${Math.abs(diffPercent).toFixed(1)}% below market. Negotiate higher.`
            : "TI allowance at market rate.",
    });
  }

  // Annual Escalation comparison
  if (leaseTerms.annualEscalation !== undefined && benchmark.avg_annual_escalation) {
    const diff = leaseTerms.annualEscalation - benchmark.avg_annual_escalation;
    comparisons.push({
      metric: "escalation",
      label: "Annual Escalation",
      yourValue: `${leaseTerms.annualEscalation.toFixed(2)}%`,
      marketValue: `${benchmark.avg_annual_escalation.toFixed(2)}%`,
      difference: `${diff > 0 ? "+" : ""}${diff.toFixed(2)}%`,
      differencePercent: diff,
      status: diff < 0 ? "favorable" : diff > 0 ? "unfavorable" : "neutral",
      explanation:
        diff < 0
          ? `Lower annual increases than market average.`
          : diff > 0
            ? `Higher annual increases than typical. Negotiate lower escalations.`
            : "Standard annual escalation rate.",
    });
  }

  // Free Rent comparison
  if (leaseTerms.freeRentMonths !== undefined && benchmark.avg_free_rent_months) {
    const diff = leaseTerms.freeRentMonths - benchmark.avg_free_rent_months;
    comparisons.push({
      metric: "freeRent",
      label: "Free Rent Period",
      yourValue: `${leaseTerms.freeRentMonths} months`,
      marketValue: `${benchmark.avg_free_rent_months} months`,
      difference: `${diff > 0 ? "+" : ""}${diff} months`,
      differencePercent: diff,
      status: diff > 0 ? "favorable" : diff < 0 ? "unfavorable" : "neutral",
      explanation:
        diff > 0
          ? `${diff} more months of free rent than average!`
          : diff < 0
            ? `${Math.abs(diff)} fewer months of free rent. Ask for more.`
            : "Standard free rent period.",
    });
  }

  // Protective clauses comparisons
  if (leaseTerms.hasRenewalOption !== undefined) {
    comparisons.push({
      metric: "renewalOption",
      label: "Renewal Option",
      yourValue: leaseTerms.hasRenewalOption ? "Yes" : "No",
      marketValue: benchmark.renewal_option_common ? "Common" : "Uncommon",
      difference: "",
      differencePercent: 0,
      status:
        leaseTerms.hasRenewalOption || !benchmark.renewal_option_common
          ? "favorable"
          : "unfavorable",
      explanation: leaseTerms.hasRenewalOption
        ? "You have a renewal option - protects your tenancy."
        : "No renewal option. Consider negotiating one.",
    });
  }

  if (leaseTerms.hasEarlyTermination !== undefined) {
    comparisons.push({
      metric: "earlyTermination",
      label: "Early Termination",
      yourValue: leaseTerms.hasEarlyTermination ? "Yes" : "No",
      marketValue: benchmark.early_termination_common ? "Common" : "Uncommon",
      difference: "",
      differencePercent: 0,
      status: leaseTerms.hasEarlyTermination ? "favorable" : "neutral",
      explanation: leaseTerms.hasEarlyTermination
        ? "Early termination clause provides flexibility."
        : "No early termination. Consider adding for flexibility.",
    });
  }

  if (leaseTerms.hasPersonalGuarantee !== undefined) {
    comparisons.push({
      metric: "personalGuarantee",
      label: "Personal Guarantee",
      yourValue: leaseTerms.hasPersonalGuarantee ? "Required" : "Not Required",
      marketValue: benchmark.personal_guarantee_common ? "Common" : "Uncommon",
      difference: "",
      differencePercent: 0,
      status:
        !leaseTerms.hasPersonalGuarantee && benchmark.personal_guarantee_common
          ? "favorable"
          : leaseTerms.hasPersonalGuarantee
            ? "neutral"
            : "favorable",
      explanation: leaseTerms.hasPersonalGuarantee
        ? "Personal guarantee required - increases your liability."
        : "No personal guarantee - limits personal liability.",
    });
  }

  // Calculate overall assessment
  const favorable = comparisons.filter((c) => c.status === "favorable").length;
  const unfavorable = comparisons.filter((c) => c.status === "unfavorable").length;

  let overallAssessment = "";
  if (favorable > unfavorable + 2) {
    overallAssessment =
      "This lease is significantly better than market average. You've negotiated well!";
  } else if (favorable > unfavorable) {
    overallAssessment =
      "This lease is slightly above market average with some favorable terms.";
  } else if (unfavorable > favorable + 2) {
    overallAssessment =
      "This lease has several terms below market average. Consider renegotiating.";
  } else if (unfavorable > favorable) {
    overallAssessment =
      "This lease has some areas that could be improved through negotiation.";
  } else {
    overallAssessment = "This lease is roughly in line with market standards.";
  }

  // Identify savings opportunities
  const savingsOpportunities: string[] = [];

  const rentComparison = comparisons.find((c) => c.metric === "rent");
  if (rentComparison?.status === "unfavorable") {
    savingsOpportunities.push(
      `Negotiate rent closer to market average ($${benchmark.avg_rent_per_sf}/sf)`
    );
  }

  const tiComparison = comparisons.find((c) => c.metric === "ti");
  if (tiComparison?.status === "unfavorable") {
    savingsOpportunities.push(
      `Request higher TI allowance (market: $${benchmark.avg_ti_allowance_per_sf}/sf)`
    );
  }

  const freeRentComparison = comparisons.find((c) => c.metric === "freeRent");
  if (freeRentComparison?.status === "unfavorable") {
    savingsOpportunities.push(
      `Ask for ${benchmark.avg_free_rent_months} months free rent (market standard)`
    );
  }

  const renewalComparison = comparisons.find((c) => c.metric === "renewalOption");
  if (renewalComparison?.status === "unfavorable") {
    savingsOpportunities.push("Add a renewal option to protect your tenancy");
  }

  return {
    benchmark,
    comparisons,
    overallAssessment,
    savingsOpportunities,
  };
}

