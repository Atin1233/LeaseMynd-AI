/**
 * AI-Powered Commercial Real Estate Lease Scoring Framework
 * Version 1.0
 * 
 * Total Possible Points: 1000
 * Scoring Methodology: Percentage of checklist items successfully and correctly included in lease
 * 
 * Final Score = (Total Points Earned / 1000) * 100
 */

export const SCORING_FRAMEWORK = {
  metadata: {
    version: "1.0",
    description: "AI-Powered Commercial Real Estate Lease Analysis Checklist",
    total_possible_points: 1000,
    scoring_methodology: "Percentage of checklist items successfully and correctly included in lease"
  },
  
  categories: [
    // ============================================================================
    // CORE SCORING ENGINE - Weighted Risk Scoring Categories
    // ============================================================================
    
    // Category 1: Unfavorable Terms Detection (15% weight, 150 points)
    {
      id: "unfavorable_terms_detection",
      name: "Unfavorable Terms Detection",
      weight: 15,
      points: 150,
      items: [
        { id: "UT-001", check: "Base rent at or below market rate for property type and submarket", points: 20, verification: "Benchmark against comparable transactions; verify BOMA standard area calculations" },
        { id: "UT-002", check: "Rent escalation rates within market norms (2-3% fixed or CPI with floor/cap)", points: 20, verification: "Flag uncapped CPI escalations; verify compounding effects over lease term" },
        { id: "UT-003", check: "Security deposit requirement reasonable (1-3 months for credit tenants)", points: 15, verification: "Compare to tenant credit quality and market standards; verify interest-bearing requirements" },
        { id: "UT-004", check: "Expense allocation properly balanced (NNN vs. Gross lease appropriateness)", points: 20, verification: "Verify capital expenditure exclusions; confirm management fee caps (10-15%)" },
        { id: "UT-005", check: "Percentage rent terms favorable (retail only)", points: 15, verification: "Natural breakpoint = base rent ÷ percentage rate; verify gross sales exclusions" },
        { id: "UT-006", check: "Free rent/abatement periods adequate and properly structured", points: 15, verification: "Confirm clawback provisions limited; verify expense applicability during abatement" },
        { id: "UT-007", check: "Load factor calculations comply with BOMA standards (10-20% typical)", points: 15, verification: "Verify 2010 or 2017 BOMA standard compliance; challenge excessive load factors" },
        { id: "UT-008", check: "Expense caps present and properly structured", points: 15, verification: "Confirm cumulative vs. non-cumulative treatment; verify uncontrollable cost exceptions" }
      ]
    },
    
    // Category 2: Missing Protections Identification (15% weight, 150 points)
    {
      id: "missing_protections_identification",
      name: "Missing Protections Identification",
      weight: 15,
      points: 150,
      items: [
        { id: "MP-001", check: "CAM/operating expense audit rights included", points: 20, verification: "Annual reconciliation within 90-120 days; third-party audit rights; cost-shifting for >3-5% overcharges" },
        { id: "MP-002", check: "Exclusivity clauses present (retail/medical)", points: 20, verification: "Scope covers actual and anticipated business; enforcement mechanisms specified" },
        { id: "MP-003", check: "Co-tenancy protections included (retail)", points: 20, verification: "Opening and ongoing co-tenancy; 70-85% occupancy thresholds; rent reduction/termination rights" },
        { id: "MP-004", check: "Modernized force majeure provisions post-COVID", points: 15, verification: "Explicit pandemic language; government closure coverage; rent abatement/deferral rights" },
        { id: "MP-005", check: "Business interruption remedies specified", points: 15, verification: "Rent abatement triggers; restoration timelines; termination rights for extended casualty" },
        { id: "MP-006", check: "Self-help rights limited or prohibited", points: 15, verification: "Verify jurisdiction-specific rules; require notice and cure periods before landlord remedies" },
        { id: "MP-007", check: "Mitigation of damages explicitly required", points: 15, verification: "Critical in AL, GA, MN, MS, NY, WV; specify mitigation standard in lease" },
        { id: "MP-008", check: "Materiality thresholds for default triggers", points: 15, verification: "Reject 'any breach' language; specify de minimis exceptions; define material breach" }
      ]
    },
    
    // Category 3: Ambiguity Quantification (10% weight, 100 points)
    {
      id: "ambiguity_quantification",
      name: "Ambiguity Quantification",
      weight: 10,
      points: 100,
      items: [
        { id: "AQ-001", check: "Vague standards replaced with objective criteria", points: 20, verification: "Replace 'reasonable,' 'satisfactory,' 'material' with specific metrics or third-party standards" },
        { id: "AQ-002", check: "Cure periods explicitly defined by default type", points: 20, verification: "3-5 business days monetary; 10-15 days non-monetary; 30+ days complex compliance" },
        { id: "AQ-003", check: "Maintenance boundaries clearly mapped", points: 20, verification: "System-by-system responsibility matrix; capital vs. operating distinction explicit" },
        { id: "AQ-004", check: "Pro-rata share calculations fully defined", points: 20, verification: "Verify denominator consistency; confirm excluded space treatment; reconciliation rights" },
        { id: "AQ-005", check: "Default consequences and termination triggers specific", points: 20, verification: "No undefined 'any breach' triggers; materiality thresholds specified; cure opportunities defined" }
      ]
    },
    
    // Category 4: One-Sidedness Assessment (10% weight, 100 points)
    {
      id: "one_sidedness_assessment",
      name: "One-Sidedness Assessment",
      weight: 10,
      points: 100,
      items: [
        { id: "OS-001", check: "Landlord discretion subject to reasonableness standards", points: 20, verification: "Consent to assignment/alterations not 'sole discretion'; objective criteria specified" },
        { id: "OS-002", check: "Unilateral termination/relocation rights limited or eliminated", points: 20, verification: "No uncompensated relocation; termination requires substantial cause; adequate notice periods" },
        { id: "OS-003", check: "Statutory protections preserved (no waivers)", points: 15, verification: "Warranty of habitability; retaliation protection; habitability standards maintained" },
        { id: "OS-004", check: "Automatic renewal terms symmetric and noticed", points: 15, verification: "Mutual notice requirements; adequate advance warning (6-12 months); no hidden extensions" },
        { id: "OS-005", check: "Dispute resolution neutral and cost-balanced", points: 15, verification: "Forum selection fair; arbitration not mandatory; jury trial rights preserved" },
        { id: "OS-006", check: "Recapture rights limited to excess rent situations", points: 15, verification: "Tenant rescission right; compensation for improvements and moving costs" }
      ]
    },
    
    // Category 5: Landlord/Tenant Bias Calibration (10% weight, 100 points)
    {
      id: "landlord_tenant_bias_calibration",
      name: "Landlord/Tenant Bias Calibration",
      weight: 10,
      points: 100,
      items: [
        { id: "BC-001", check: "Assignment consent standard jurisdictionally appropriate", points: 25, verification: "CA: reasonableness implied; MN: must negotiate explicit reasonableness; NY: market-standard reasonableness" },
        { id: "BC-002", check: "Security deposit reduction rights performance-based", points: 25, verification: "50% reduction after 12 months timely payment; full release after 24-36 months; automatic vs. request-based" },
        { id: "BC-003", check: "Tenant improvement allowance adequate and properly structured", points: 25, verification: "Front-loaded vs. reimbursement; deemed approval timelines; unused allowance rent credit" },
        { id: "BC-004", check: "Surrender obligations limited to actual condition", points: 25, verification: "Reject 'base building standard'; accept 'broom clean' or 'as-is with normal wear'; exclude improvements with no residual value" }
      ]
    },
    
    // ============================================================================
    // FINANCIAL ANALYSIS MODULES
    // ============================================================================
    
    // Category 6: Rent Escalation Structures (8% weight, 80 points)
    {
      id: "rent_escalation_structures",
      name: "Rent Escalation Structures",
      weight: 8,
      points: 80,
      items: [
        { id: "FE-001", check: "Fixed-step increases benchmarked against inflation expectations", points: 20, verification: "Model 10-year NPV under various inflation scenarios; verify compounding effects" },
        { id: "FE-002", check: "CPI-indexed adjustments have protective floors and caps", points: 20, verification: "Floor prevents deflation reductions; cap limits extreme inflation exposure; collar structures optimal" },
        { id: "FE-003", check: "Base year for expense pass-throughs properly established", points: 20, verification: "First full calendar year typical; verify occupancy adjustment mechanisms; audit base year expenses" },
        { id: "FE-004", check: "Percentage rent breakpoints achievable and verified", points: 20, verification: "Mathematical verification of natural breakpoint; sales volume feasibility analysis" }
      ]
    },
    
    // Category 7: CAM and Pass-Through Analysis (8% weight, 80 points)
    {
      id: "cam_and_pass_through_analysis",
      name: "CAM and Pass-Through Analysis",
      weight: 8,
      points: 80,
      items: [
        { id: "CAM-001", check: "Capital expenditures excluded from CAM or amortized", points: 20, verification: "Useful life amortization required; specify recovery periods (HVAC 15-20yr, roof 20-25yr)" },
        { id: "CAM-002", check: "Management fees capped at 10-15% of controllable expenses", points: 20, verification: "Verify 'controllable' definition; exclude property taxes and insurance from fee base" },
        { id: "CAM-003", check: "Expense exclusions comprehensive and specific", points: 20, verification: "Landlord corporate overhead; leasing costs; capital improvements; tenant-specific services excluded" },
        { id: "CAM-004", check: "Regional CAM variations addressed", points: 20, verification: "Northern markets: snow/ice caps; Southeast: hurricane deductible allocation; CA: seismic/energy compliance" }
      ]
    },
    
    // Category 8: Credit Enhancement Structures (7% weight, 70 points)
    {
      id: "credit_enhancement_structures",
      name: "Credit Enhancement Structures",
      weight: 7,
      points: 70,
      items: [
        { id: "CE-001", check: "Personal guaranty limited or eliminated", points: 20, verification: "Prioritize dollar-capped, time-capped, or 'good guy' structures; avoid unlimited joint and several liability" },
        { id: "CE-002", check: "Letter of credit terms favorable", points: 15, verification: "Reduction schedule specified; substitution rights for cash; draw conditions limited" },
        { id: "CE-003", check: "Parent guaranty includes release triggers", points: 15, verification: "Standalone credit improvement; substitution rights; covenant compliance monitoring" },
        { id: "CE-004", check: "Security deposit held in segregated interest-bearing account", points: 10, verification: "No commingling; interest accrues to tenant; return conditions specified" },
        { id: "CE-005", check: "Good guy guaranty properly structured (NY market)", points: 10, verification: "Specific notice requirements; surrender condition standards; explicit future rent release" }
      ]
    },
    
    // ============================================================================
    // LEGAL RISK ASSESSMENT
    // ============================================================================
    
    // Category 9: Default and Remedy Provisions (8% weight, 80 points)
    {
      id: "default_and_remedy_provisions",
      name: "Default and Remedy Provisions",
      weight: 8,
      points: 80,
      items: [
        { id: "DR-001", check: "Cure periods differentiated by default type", points: 20, verification: "Monetary: 3-5 business days; Non-monetary: 10-15 days; Complex: 30+ days with diligent pursuit" },
        { id: "DR-002", check: "Materiality requirements for non-monetary defaults", points: 20, verification: "Pattern establishment for repeated defaults; de minimis exceptions; non-material breach carve-outs" },
        { id: "DR-003", check: "Landlord remedies limited and proportional", points: 20, verification: "Self-help restricted; mitigation required; accelerated rent discounted to present value" },
        { id: "DR-004", check: "Tenant termination rights balanced", points: 20, verification: "Constructive eviction standards; landlord default cure rights; early termination buyout formulas" }
      ]
    },
    
    // Category 10: Insurance and Indemnification (6% weight, 60 points)
    {
      id: "insurance_and_indemnification",
      name: "Insurance and Indemnification",
      weight: 6,
      points: 60,
      items: [
        { id: "II-001", check: "Insurance requirements adequate but not excessive", points: 15, verification: "CGL $1-5M; Property full replacement cost; Business interruption 12-24 months; Waiver of subrogation" },
        { id: "II-002", check: "Additional insured requirements reasonable", points: 15, verification: "Landlord, lender, property manager; primary and non-contributory; limited to premises-related" },
        { id: "II-003", check: "Indemnification mutual and balanced", points: 15, verification: "Each party for own negligence; carve-outs for landlord gross negligence/willful misconduct; environmental causation-based" },
        { id: "II-004", check: "Emerging risks addressed", points: 15, verification: "Cyber liability; pandemic coverage where available; flood/earthquake per regional exposure" }
      ]
    },
    
    // Category 11: Assignment and Subletting (6% weight, 60 points)
    {
      id: "assignment_and_subletting",
      name: "Assignment and Subletting",
      weight: 6,
      points: 60,
      items: [
        { id: "AS-001", check: "Assignment consent standard appropriate for jurisdiction", points: 20, verification: "Reasonableness implied (CA, NY, TX); sole discretion permitted (MN); must negotiate protection explicitly" },
        { id: "AS-002", check: "Permitted transfers without consent broad", points: 15, verification: "Affiliates, subsidiaries, successors; change of control; merger/acquisition; asset sale" },
        { id: "AS-003", check: "Excess rent sharing favorable to tenant", points: 15, verification: "75% tenant share after costs; broaden deductible expenses; time limitation on landlord claim" },
        { id: "AS-004", check: "Recapture rights limited", points: 10, verification: "Only for profit situations; tenant rescission right; compensation for improvements" }
      ]
    },
    
    // ============================================================================
    // OPERATIONAL CLAUSES
    // ============================================================================
    
    // Category 12: Use and Exclusivity (5% weight, 50 points)
    {
      id: "use_and_exclusivity",
      name: "Use and Exclusivity",
      weight: 5,
      points: 50,
      items: [
        { id: "UE-001", check: "Permitted use scope adequate for business evolution", points: 15, verification: "Including but not limited to language; related uses; expansion rights; prohibition on undue specificity" },
        { id: "UE-002", check: "Exclusivity protections present and enforceable", points: 15, verification: "Product/service category scope; geographic radius; injunctive relief; termination for violation" },
        { id: "UE-003", check: "Co-tenancy requirements specified", points: 10, verification: "Anchor tenant opening requirement; ongoing occupancy thresholds; remedy progression" },
        { id: "UE-004", check: "Radius restrictions reasonable", points: 10, verification: "Limited to specific competitive uses; reasonable geographic scope; carve-outs for existing locations" }
      ]
    },
    
    // Category 13: Maintenance and Alterations (5% weight, 50 points)
    {
      id: "maintenance_and_alterations",
      name: "Maintenance and Alterations",
      weight: 5,
      points: 50,
      items: [
        { id: "MA-001", check: "Structural vs. non-structural responsibilities clear", points: 15, verification: "Landlord: foundation, roof, structure; Tenant: interior, non-structural; boundary definitions with diagrams" },
        { id: "MA-002", check: "Alteration approval process reasonable", points: 15, verification: "Cosmetic: notice only; Non-structural: not unreasonably withheld (10-15 days); Structural: objective criteria" },
        { id: "MA-003", check: "Ownership of improvements clarified", points: 10, verification: "Trade fixtures remain tenant property; structural improvements vest in landlord; removal rights specified" },
        { id: "MA-004", check: "Lien and permit protections adequate", points: 10, verification: "Mechanic's lien indemnification; permit compliance; as-built documentation requirements" }
      ]
    },
    
    // ============================================================================
    // PROPERTY TYPE SPECIFIC
    // ============================================================================
    
    // Category 14: Office Specific (3% weight, 30 points)
    {
      id: "office_specific",
      name: "Office Specific",
      weight: 3,
      points: 30,
      property_types: ["office"],
      items: [
        { id: "OFF-001", check: "HVAC hours adequate; after-hours charges reasonable", points: 10, verification: "Monday-Friday 7AM-6PM minimum; Saturday availability; $25-75/hour zone typical after-hours" },
        { id: "OFF-002", check: "Parking ratio guaranteed and sufficient", points: 10, verification: "2.0-4.0 per 1000 SF suburban; 0.5-1.5 urban; reserved vs. unreserved allocation specified" },
        { id: "OFF-003", check: "Technology infrastructure adequate", points: 10, verification: "Dual carrier fiber; 1 Gbps+ capacity; redundant connectivity; data center capabilities if needed" }
      ]
    },
    
    // Category 15: Retail Specific (4% weight, 40 points)
    {
      id: "retail_specific",
      name: "Retail Specific",
      weight: 4,
      points: 40,
      property_types: ["retail"],
      items: [
        { id: "RET-001", check: "Percentage rent terms favorable", points: 10, verification: "3-7% inline; 2-3% anchor; 5-10% food/entertainment; breakpoint calculation verified" },
        { id: "RET-002", check: "Sales reporting and audit rights comprehensive", points: 10, verification: "Monthly estimates; annual certification; broad exclusions (returns, taxes, employee sales); audit rights" },
        { id: "RET-003", check: "Co-tenancy protections robust", points: 10, verification: "Opening: anchor open before rent commencement; Ongoing: 70-85% occupancy; Sales: termination for underperformance" },
        { id: "RET-004", check: "Signage rights adequate", points: 10, verification: "Exterior building signage; storefront; directory; temporary promotional; relocation rights; removal obligations" }
      ]
    },
    
    // Category 16: Industrial Specific (3% weight, 30 points)
    {
      id: "industrial_specific",
      name: "Industrial Specific",
      weight: 3,
      points: 30,
      property_types: ["industrial", "warehouse"],
      items: [
        { id: "IND-001", check: "Loading and clear height specifications adequate", points: 10, verification: "Dock doors 1 per 10-15k SF; truck court 100-150 feet; clear height 24-36 feet typical; floor load 125-250 psf" },
        { id: "IND-002", check: "Environmental liability allocation favorable", points: 10, verification: "Baseline assessment; tenant only for caused contamination; landlord for pre-existing; regulatory change flexibility" },
        { id: "IND-003", check: "Utility capacity and redundancy sufficient", points: 10, verification: "Electrical 400-2000+ amps; gas service; water/sewer capacity; telecom redundancy; diverse routing" }
      ]
    },
    
    // Category 17: Medical Office Specific (3% weight, 30 points)
    {
      id: "medical_office_specific",
      name: "Medical Office Specific",
      weight: 3,
      points: 30,
      property_types: ["medical", "healthcare"],
      items: [
        { id: "MED-001", check: "Healthcare regulatory compliance addressed", points: 10, verification: "Stark Law FMV rent; Anti-Kickback compliance; HIPAA business associate agreement; Medicare/Medicaid conditions" },
        { id: "MED-002", check: "Specialized infrastructure adequate", points: 10, verification: "Medical gas systems; emergency power 10-second auto-start; infection control HVAC; imaging equipment support" },
        { id: "MED-003", check: "Use restrictions and exclusivity compliant", points: 10, verification: "Hospital-affiliated network integrity; non-compete enforceability; exclusive arrangements antitrust-compliant" }
      ]
    },
    
    // ============================================================================
    // JURISDICTIONAL COMPLIANCE
    // ============================================================================
    
    // Category 18: Jurisdictional Compliance (4% weight, 40 points)
    {
      id: "jurisdictional_compliance",
      name: "Jurisdictional Compliance",
      weight: 4,
      points: 40,
      items: [
        { id: "JUR-001", check: "State-specific assignment consent rules followed", points: 10, verification: "CA: reasonableness implied; MN: sole discretion permitted; NY: market-standard reasonableness; TX: reasonableness often implied" },
        { id: "JUR-002", check: "Regional CAM and expense variations addressed", points: 10, verification: "Northern: snow/ice expense caps; Southeast: hurricane/flood insurance; CA: seismic retrofit/energy compliance" },
        { id: "JUR-003", check: "Rent control and stabilization compliance verified", points: 10, verification: "CA local ordinances (SF, LA, Oakland); NYC rent stabilization exemption verification; luxury de minimis thresholds" },
        { id: "JUR-004", check: "Good guy guaranty compliance (NY market)", points: 10, verification: "Proper surrender mechanics; condition satisfaction; release trigger clarity; market-standard acceptance" }
      ]
    }
  ],
  
  // Score interpretation guide
  interpretation: {
    "90-100": { level: "excellent", description: "Market-leading lease terms with comprehensive protections" },
    "80-89": { level: "good", description: "Above-average terms with minor negotiation opportunities" },
    "70-79": { level: "fair", description: "Standard market terms with several areas requiring attention" },
    "60-69": { level: "poor", description: "Below-market terms with significant risks requiring immediate negotiation" },
    "0-59": { level: "critical", description: "Unacceptable risk profile, fundamental restructuring required" }
  }
} as const;

// Helper type for category items
export interface ScoringItem {
  id: string;
  check: string;
  points: number;
  verification: string;
  earned?: boolean;
}

export interface CategoryScore {
  id: string;
  name: string;
  weight: number;
  max_points: number;
  earned_points: number;
  items_evaluated: {
    id: string;
    check: string;
    points: number;
    earned: boolean;
    notes?: string;
  }[];
}

export interface ScoringResult {
  total_points_earned: number;
  total_possible_points: number;
  percentage_score: number;
  risk_level: "excellent" | "good" | "fair" | "poor" | "critical";
  category_scores: CategoryScore[];
  summary: string;
}

/**
 * Get risk level from percentage score
 */
export function getRiskLevelFromScore(score: number): "excellent" | "good" | "fair" | "poor" | "critical" {
  if (score >= 90) return "excellent";
  if (score >= 80) return "good";
  if (score >= 70) return "fair";
  if (score >= 60) return "poor";
  return "critical";
}

/**
 * Get all checklist items as a flat list for AI prompt
 */
export function getAllChecklistItems(): { id: string; check: string; points: number; category: string }[] {
  const items: { id: string; check: string; points: number; category: string }[] = [];
  
  for (const category of SCORING_FRAMEWORK.categories) {
    for (const item of category.items) {
      items.push({
        id: item.id,
        check: item.check,
        points: item.points,
        category: category.name
      });
    }
  }
  
  return items;
}

/**
 * Get total number of checklist items
 */
export function getTotalChecklistItems(): number {
  return SCORING_FRAMEWORK.categories.reduce((sum, cat) => sum + cat.items.length, 0);
}

/**
 * Calculate score from item results
 */
export function calculateScoreFromResults(
  itemResults: Record<string, boolean>,
  propertyType?: string
): ScoringResult {
  let totalEarned = 0;
  let totalPossible = 0;
  const categoryScores: CategoryScore[] = [];
  
  for (const category of SCORING_FRAMEWORK.categories) {
    // Skip property-type specific categories if not applicable
    const propertyTypes = (category as any).property_types as string[] | undefined;
    if (propertyTypes && propertyType && !propertyTypes.some(pt => 
      propertyType.toLowerCase().includes(pt.toLowerCase())
    )) {
      continue;
    }
    
    let categoryEarned = 0;
    const itemsEvaluated: CategoryScore["items_evaluated"] = [];
    
    for (const item of category.items) {
      const earned = itemResults[item.id] === true;
      if (earned) {
        categoryEarned += item.points;
        totalEarned += item.points;
      }
      totalPossible += item.points;
      
      itemsEvaluated.push({
        id: item.id,
        check: item.check,
        points: item.points,
        earned
      });
    }
    
    categoryScores.push({
      id: category.id,
      name: category.name,
      weight: category.weight,
      max_points: category.points,
      earned_points: categoryEarned,
      items_evaluated: itemsEvaluated
    });
  }
  
  const percentageScore = totalPossible > 0 
    ? Math.round((totalEarned / totalPossible) * 100) 
    : 0;
  
  const riskLevel = getRiskLevelFromScore(percentageScore);
  
  return {
    total_points_earned: totalEarned,
    total_possible_points: totalPossible,
    percentage_score: percentageScore,
    risk_level: riskLevel,
    category_scores: categoryScores,
    summary: SCORING_FRAMEWORK.interpretation[
      percentageScore >= 90 ? "90-100" :
      percentageScore >= 80 ? "80-89" :
      percentageScore >= 70 ? "70-79" :
      percentageScore >= 60 ? "60-69" : "0-59"
    ].description
  };
}
