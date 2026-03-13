import { callGoogleAI } from "../google-ai/client";
import type {
  LeaseAnalysisResult,
  ClauseExtraction,
  RiskAssessment,
} from "./types";
import { 
  SCORING_FRAMEWORK,
  getRiskLevelFromScore,
  type ScoringResult 
} from "./scoring-framework";

// ============================================================
// ATTORNEY IDENTITY - Core system prompt
// ============================================================
const ATTORNEY_IDENTITY = `You are the #1 ranked commercial real estate attorney in the United States, specializing in contract law and real estate lease agreements. You have 30+ years of experience representing Fortune 500 tenants in lease negotiations.

Your expertise includes:
- Commercial lease analysis and negotiation
- Contract risk assessment and mitigation
- Landlord-tenant law across all 50 states
- Real estate finance and investment structures
- Property-type specific lease requirements (office, retail, industrial, medical)

You analyze leases from the TENANT'S perspective, identifying risks, missing protections, and unfavorable terms. Your analysis is thorough, precise, and actionable.`;

// ============================================================
// COMPREHENSIVE 1000-POINT SCORING PROMPT
// ============================================================
function generateComprehensiveScoringPrompt(): string {
  return `${ATTORNEY_IDENTITY}

## YOUR TASK

Analyze this commercial lease using the comprehensive 1000-point scoring framework. You must evaluate EVERY category and EVERY item, providing specific scores with detailed justifications referencing actual lease provisions (Article numbers, Section numbers, exact quotes).

## SCORING FRAMEWORK (1000 TOTAL POINTS)

### CATEGORY 1: UNFAVORABLE TERMS DETECTION (150 points)
| ID | Check | Points |
|---|---|---|
| UT-001 | Base rent at or below market rate for property type and submarket | 20 |
| UT-002 | Rent escalation rates within market norms (2-3% fixed or CPI with floor/cap) | 20 |
| UT-003 | Security deposit requirement reasonable (1-3 months for credit tenants) | 15 |
| UT-004 | Expense allocation properly balanced (NNN vs. Gross lease appropriateness) | 20 |
| UT-005 | Percentage rent terms favorable (retail only) | 15 |
| UT-006 | Free rent/abatement periods adequate and properly structured | 15 |
| UT-007 | Load factor calculations comply with BOMA standards (10-20% typical) | 15 |
| UT-008 | Expense caps present and properly structured | 15 |

### CATEGORY 2: MISSING PROTECTIONS IDENTIFICATION (150 points)
| ID | Check | Points |
|---|---|---|
| MP-001 | CAM/operating expense audit rights included | 20 |
| MP-002 | Exclusivity clauses present (retail/medical) | 20 |
| MP-003 | Co-tenancy protections included (retail) | 20 |
| MP-004 | Modernized force majeure provisions post-COVID | 15 |
| MP-005 | Business interruption remedies specified | 15 |
| MP-006 | Self-help rights limited or prohibited | 15 |
| MP-007 | Mitigation of damages explicitly required | 15 |
| MP-008 | Materiality thresholds for default triggers | 15 |

### CATEGORY 3: AMBIGUITY QUANTIFICATION (100 points)
| ID | Check | Points |
|---|---|---|
| AQ-001 | Vague standards replaced with objective criteria | 20 |
| AQ-002 | Cure periods explicitly defined by default type | 20 |
| AQ-003 | Maintenance boundaries clearly mapped | 20 |
| AQ-004 | Pro-rata share calculations fully defined | 20 |
| AQ-005 | Default consequences and termination triggers specific | 20 |

### CATEGORY 4: ONE-SIDEDNESS ASSESSMENT (100 points)
| ID | Check | Points |
|---|---|---|
| OS-001 | Landlord discretion subject to reasonableness standards | 20 |
| OS-002 | Unilateral termination/relocation rights limited or eliminated | 20 |
| OS-003 | Statutory protections preserved (no waivers) | 15 |
| OS-004 | Automatic renewal terms symmetric and noticed | 15 |
| OS-005 | Dispute resolution neutral and cost-balanced | 15 |
| OS-006 | Recapture rights limited to excess rent situations | 15 |

### CATEGORY 5: LANDLORD-TENANT BIAS CALIBRATION (100 points)
| ID | Check | Points |
|---|---|---|
| BC-001 | Assignment consent standard jurisdictionally appropriate | 25 |
| BC-002 | Security deposit reduction rights performance-based | 25 |
| BC-003 | Tenant improvement allowance adequate and properly structured | 25 |
| BC-004 | Surrender obligations limited to actual condition | 25 |

### CATEGORY 6: RENT ESCALATION STRUCTURES (80 points)
| ID | Check | Points |
|---|---|---|
| FE-001 | Fixed-step increases benchmarked against inflation expectations | 20 |
| FE-002 | CPI-indexed adjustments have protective floors and caps | 20 |
| FE-003 | Base year for expense pass-throughs properly established | 20 |
| FE-004 | Percentage rent breakpoints achievable and verified | 20 |

### CATEGORY 7: CAM AND PASS-THROUGH ANALYSIS (80 points)
| ID | Check | Points |
|---|---|---|
| CAM-001 | Capital expenditures excluded from CAM or amortized | 20 |
| CAM-002 | Management fees capped at 10-15% of controllable expenses | 20 |
| CAM-003 | Expense exclusions comprehensive and specific | 20 |
| CAM-004 | Regional CAM variations addressed | 20 |

### CATEGORY 8: CREDIT ENHANCEMENT STRUCTURES (70 points)
| ID | Check | Points |
|---|---|---|
| CE-001 | Personal guaranty limited or eliminated | 20 |
| CE-002 | Letter of credit terms favorable | 15 |
| CE-003 | Parent guaranty includes release triggers | 15 |
| CE-004 | Security deposit held in segregated interest-bearing account | 10 |
| CE-005 | Good guy guaranty properly structured (NY market) | 10 |

### CATEGORY 9: DEFAULT AND REMEDY PROVISIONS (80 points)
| ID | Check | Points |
|---|---|---|
| DR-001 | Cure periods differentiated by default type | 20 |
| DR-002 | Materiality requirements for non-monetary defaults | 20 |
| DR-003 | Landlord remedies limited and proportional | 20 |
| DR-004 | Tenant termination rights balanced | 20 |

### CATEGORY 10: INSURANCE AND INDEMNIFICATION (60 points)
| ID | Check | Points |
|---|---|---|
| II-001 | Insurance requirements adequate but not excessive | 15 |
| II-002 | Additional insured requirements reasonable | 15 |
| II-003 | Indemnification mutual and balanced | 15 |
| II-004 | Emerging risks addressed | 15 |

### CATEGORY 11: ASSIGNMENT AND SUBLETTING (60 points)
| ID | Check | Points |
|---|---|---|
| AS-001 | Assignment consent standard appropriate for jurisdiction | 20 |
| AS-002 | Permitted transfers without consent broad | 15 |
| AS-003 | Excess rent sharing favorable to tenant | 15 |
| AS-004 | Recapture rights limited | 10 |

### CATEGORY 12: USE AND EXCLUSIVITY (50 points)
| ID | Check | Points |
|---|---|---|
| UE-001 | Permitted use scope adequate for business evolution | 15 |
| UE-002 | Exclusivity protections present and enforceable | 15 |
| UE-003 | Co-tenancy requirements specified | 10 |
| UE-004 | Radius restrictions reasonable | 10 |

### CATEGORY 13: MAINTENANCE AND ALTERATIONS (50 points)
| ID | Check | Points |
|---|---|---|
| MA-001 | Structural vs. non-structural responsibilities clear | 15 |
| MA-002 | Alteration approval process reasonable | 15 |
| MA-003 | Ownership of improvements clarified | 10 |
| MA-004 | Lien and permit protections adequate | 10 |

### CATEGORY 14: PROPERTY TYPE SPECIFIC (30 points - use applicable type)
**Office**: OFF-001 (HVAC hours 10pts), OFF-002 (Parking 10pts), OFF-003 (Technology 10pts)
**Retail**: RET-001 (% rent 10pts), RET-002 (Sales reporting 7pts), RET-003 (Co-tenancy 7pts), RET-004 (Signage 6pts)
**Industrial**: IND-001 (Loading/height 10pts), IND-002 (Environmental 10pts), IND-003 (Utilities 10pts)
**Medical**: MED-001 (Regulatory 10pts), MED-002 (Infrastructure 10pts), MED-003 (Use restrictions 10pts)

### CATEGORY 15: JURISDICTIONAL COMPLIANCE (40 points)
| ID | Check | Points |
|---|---|---|
| JUR-001 | State-specific assignment consent rules followed | 10 |
| JUR-002 | Regional CAM and expense variations addressed | 10 |
| JUR-003 | Rent control and stabilization compliance verified | 10 |
| JUR-004 | Good guy guaranty compliance (NY market) | 10 |

## SCORING RULES

1. **✅ PASS** = Full points - Lease adequately addresses item favorably for tenant
2. **⚠️ PARTIAL** = Half points (rounded up) - Lease addresses item but with deficiencies, is neutral, or is standard market
3. **❌ FAIL** = 0 points - Missing, explicitly unfavorable, or creates significant tenant risk
4. **N/A** = Full points - Not applicable to this property type/situation (e.g., percentage rent for office lease)
5. **❓ UNKNOWN** = 0 points - Cannot determine from lease text (missing information)

## SCORING CALIBRATION GUIDANCE

**Expected Score Ranges:**
- **90-100%**: Exceptional tenant-negotiated lease with comprehensive protections (rare)
- **80-89%**: Strong lease with good tenant protections, minor gaps
- **70-79%**: Standard market lease, balanced terms, some negotiation opportunities
- **60-69%**: Landlord-favorable lease requiring negotiation before signing
- **40-59%**: Significantly landlord-favorable, major restructuring needed
- **20-39%**: Severely deficient lease, missing critical protections
- **Below 20%**: Incomplete template or non-functional lease document

**Calibration Rules:**
- A standard, professionally-drafted commercial lease should score 65-75%
- Award PARTIAL credit for standard market terms even if not tenant-optimal
- Mark N/A (full points) for items that don't apply to the property type
- Only mark FAIL for provisions that genuinely harm tenant interests

**CRITICAL - INCOMPLETE TEMPLATES:**
- If the lease contains [UNCHANGED], [INSERT], [TBD], or similar placeholders: SCORE BELOW 30%
- If actual rent amount is missing or just says "rent": FAIL all financial categories
- If property address is "[Property Address]" or similar placeholder: FAIL
- If sections are blank or say "to be determined": FAIL those sections
- A lease template without actual terms is NOT a valid lease and should score 15-25%
- Do NOT give credit for sections marked [UNCHANGED] - these have no actual content

## REQUIRED OUTPUT FORMAT

Return a COMPACT JSON object. Keep descriptions brief (1-2 sentences max). Do NOT include full suggested language - just brief recommendations.

{
  "lease_title": "Tenant / Property Lease",
  "property_details": {
    "address": "Address",
    "property_type": "office|retail|industrial|medical|warehouse",
    "square_footage": "X SF",
    "lease_term": "X years",
    "base_rent": "$X/month",
    "landlord": "Landlord name",
    "tenant": "Tenant name"
  },
  "final_score": {
    "points_earned": <number>,
    "points_possible": 1000,
    "percentage": <number 0-100>,
    "tier": "Excellent|Good|Fair|Poor|Critical"
  },
  "category_scores": [
    {
      "category_id": 1,
      "category_name": "Unfavorable Terms Detection",
      "points_possible": 150,
      "points_earned": <number>,
      "percentage": <number>,
      "major_issues": ["Brief issue with Article ref"]
    }
  ],
  "executive_summary": "2-3 sentences: Overall assessment, key risks, recommendation.",
  "critical_deficiencies": [
    {
      "title": "Issue title",
      "description": "Brief explanation",
      "article_reference": "Article X",
      "impact": "Financial/business impact",
      "recommendation": "Brief fix"
    }
  ],
  "surprisingly_favorable_provisions": [
    {
      "title": "Provision",
      "description": "Why favorable",
      "article_reference": "Article X"
    }
  ],
  "strengths": [
    {
      "title": "Strength",
      "description": "Brief benefit",
      "article_reference": "Article X"
    }
  ],
  "concerns": [
    {
      "title": "Concern",
      "description": "Brief issue",
      "risk_level": "medium|high",
      "article_reference": "Article X",
      "current_text": "Brief quote",
      "revised_language": "Brief fix"
    }
  ],
  "high_risk_items": [
    {
      "title": "Risk item",
      "description": "Brief danger",
      "priority": "critical|high",
      "article_reference": "Article X",
      "current_text": "Brief quote",
      "revised_language": "Brief fix"
    }
  ],
  "missing_clauses": [
    {
      "clause_type": "Clause name",
      "importance": "critical|high|medium",
      "risk_if_missing": "Brief risk"
    }
  ],
  "recommendations": [
    {
      "priority": "critical|high|medium",
      "title": "Recommendation",
      "suggested_change": "Brief ask",
      "risk_reduction": <5-25>,
      "difficulty": "easy|moderate|hard"
    }
  ],
  "negotiation_priorities": {
    "must_fix": ["Top 3 critical items"],
    "strongly_negotiate": ["Next 3 items"],
    "nice_to_have": ["2-3 items"]
  },
  "final_assessment": "One sentence verdict."
}

## CRITICAL INSTRUCTIONS

1. **CITE ARTICLES**: Reference Article/Section numbers (e.g., "Article VI.2")
2. **BE BRIEF**: Keep all descriptions to 1-2 sentences. No lengthy explanations.
3. **BE CALIBRATED**: Standard lease = 65-75%. Don't be overly punitive.
4. **CALCULATE ACCURATELY**: Final score = sum of category scores
5. **LIMIT ITEMS**: Max 5 items per array (strengths, concerns, high_risk_items, etc.)
6. **NO FULL CLAUSES**: Don't include full suggested clause text - just brief recommendations
7. **RESPONSE SIZE**: Keep total response under 20KB. Be concise.`;
}

// ============================================================
// PRE-VALIDATION FUNCTION
// ============================================================
interface PreValidationResult {
  isLeaseDocument: boolean;
  isIncompleteTemplate: boolean;
  documentQualityScore: number;
  issues: string[];
  hasLandlordMention: boolean;
  hasTenantMention: boolean;
  hasPremisesMention: boolean;
  hasRentMention: boolean;
  hasTermMention: boolean;
  hasActualRentAmount: boolean;
  hasActualTermDates: boolean;
  hasActualAddress: boolean;
  placeholderCount: number;
  unchangedCount: number;
}

function validateLeaseContent(content: string): PreValidationResult {
  const issues: string[] = [];
  const contentLower = content.toLowerCase();
  const contentLength = content.replace(/\s+/g, " ").trim().length;
  
  const hasLandlordMention = /landlord|lessor|owner/i.test(content);
  const hasTenantMention = /tenant|lessee|renter/i.test(content);
  const hasPremisesMention = /premises|property|space|building|suite/i.test(content);
  const hasRentMention = /rent|payment|lease payment|\$/i.test(content);
  const hasTermMention = /term|year|month|commence|expir/i.test(content);
  
  // Check for ACTUAL values vs placeholders - be more flexible with formats
  // Rent can be expressed many ways: $5,000, $50/SF, 5000 dollars, etc.
  const hasActualRentAmount = /\$\s*[\d,]+(?:\.\d{2})?/i.test(content) || 
                              /[\d,]+\s*(?:dollars|per\s*(?:month|year|annum|sf))/i.test(content) ||
                              /(?:base|monthly|annual)\s*rent[:\s]+[\d,\$]+/i.test(content);
  
  // Dates can be many formats
  const hasActualTermDates = /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i.test(content) ||
                             /\d{1,2}\/\d{1,2}\/\d{2,4}/i.test(content) ||
                             /\d{4}/i.test(content); // Just having a year is often enough
  
  // Addresses can be complex - just check for any specific location indicators
  const hasActualAddress = /\d+\s+[A-Za-z]/i.test(content) || // Number followed by text
                           /(?:suite|floor|building|tower)\s*(?:#|\d)/i.test(content) ||
                           /[A-Za-z]+,\s*[A-Z]{2}\s*\d{5}/i.test(content); // City, ST ZIP
  
  // Count ONLY specific template placeholders - not all brackets
  const unchangedCount = (content.match(/\[UNCHANGED\]/gi) || []).length;
  
  // Only count brackets that are clearly placeholders, not legal references like [Section 4.1]
  const templatePlaceholders = (content.match(/\[(?:Property Address|Address|TBD|INSERT|BLANK|TO BE DETERMINED|___+|TENANT NAME|LANDLORD NAME)\]/gi) || []).length;
  
  // Check for clear template indicators - must be very specific
  const hasTemplateIndicators = 
    unchangedCount >= 5 || // Need at least 5 [UNCHANGED] to be considered a template
    templatePlaceholders >= 3 || // Need multiple clear placeholders
    (/\[insert\s/i.test(content) && templatePlaceholders >= 1) ||
    (/\[property\s+address\]/i.test(content) && !hasActualAddress);
  
  // Only flag as incomplete template if it's CLEARLY a template
  // Must have multiple [UNCHANGED] markers AND lack substantive content
  const isIncompleteTemplate = 
    (unchangedCount >= 5 && contentLength < 10000) || // Many [UNCHANGED] in short doc
    (templatePlaceholders >= 3) || // Multiple clear placeholders
    (unchangedCount >= 3 && !hasActualRentAmount && !hasActualTermDates); // Some [UNCHANGED] and no real terms
  
  const leaseKeywords = [
    "lease", "agreement", "landlord", "tenant", "rent", "premises",
    "term", "deposit", "maintenance", "default", "termination"
  ];
  const keywordCount = leaseKeywords.filter(kw => contentLower.includes(kw)).length;
  
  const isLeaseDocument = keywordCount >= 3 && contentLength >= 500;
  
  // Calculate quality score
  let qualityScore = 0;
  
  // Basic structure (max 30 points)
  if (hasLandlordMention) qualityScore += 5;
  if (hasTenantMention) qualityScore += 5;
  if (hasPremisesMention) qualityScore += 5;
  if (hasRentMention) qualityScore += 5;
  if (hasTermMention) qualityScore += 5;
  if (contentLength >= 2000) qualityScore += 5;
  
  // Actual substantive content (max 40 points)
  if (hasActualRentAmount) qualityScore += 15;
  if (hasActualTermDates) qualityScore += 10;
  if (hasActualAddress) qualityScore += 10;
  if (/default|breach|cure/i.test(content)) qualityScore += 5;
  
  // Length bonus for substantive content (max 30 points)
  if (contentLength >= 5000) qualityScore += 10;
  if (contentLength >= 10000) qualityScore += 10;
  if (contentLength >= 20000) qualityScore += 10;
  
  // PENALTIES only for CLEAR template indicators
  if (unchangedCount >= 5) {
    issues.push(`Document has ${unchangedCount} [UNCHANGED] placeholders - appears to be incomplete template`);
    qualityScore = Math.max(10, qualityScore - 50);
  } else if (unchangedCount >= 3) {
    issues.push(`Document has ${unchangedCount} [UNCHANGED] placeholders`);
    qualityScore = Math.max(20, qualityScore - 20);
  }
  
  if (templatePlaceholders >= 3) {
    issues.push(`Document has ${templatePlaceholders} template placeholders - missing actual terms`);
    qualityScore = Math.max(10, qualityScore - 40);
  }
  
  if (isIncompleteTemplate && unchangedCount >= 5) {
    issues.push("Document appears to be an incomplete template without actual lease terms");
    qualityScore = Math.max(10, qualityScore - 30);
  }
  
  if (!isLeaseDocument) {
    issues.push("Document does not appear to be a lease agreement");
  }
  
  return {
    isLeaseDocument,
    isIncompleteTemplate,
    documentQualityScore: Math.min(100, Math.max(0, qualityScore)),
    issues,
    hasLandlordMention,
    hasTenantMention,
    hasPremisesMention,
    hasRentMention,
    hasTermMention,
    hasActualRentAmount,
    hasActualTermDates,
    hasActualAddress,
    placeholderCount: templatePlaceholders,
    unchangedCount,
  };
}

// ============================================================
// MAIN ANALYSIS FUNCTION
// ============================================================

async function callLeaseAI(
  messages: Array<{ role: "system" | "user"; content: string }>,
  options: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {}
): Promise<{ response: string; model: string }> {
  const response = await callGoogleAI(messages, options);
  return { response, model: "gemini-2.0-flash" };
}

export async function analyzeLeaseDocument(
  content: string,
  options: {
    useAdvancedModel?: boolean;
  } = {}
): Promise<LeaseAnalysisResult & { _aiModel?: string; scoring_details?: any; category_scores?: any[]; critical_deficiencies?: any[]; surprisingly_favorable_provisions?: any[] }> {
  // Pre-validation
  const preValidation = validateLeaseContent(content);
  
  console.log(`📋 PRE-VALIDATION:`);
  console.log(`   isLeaseDocument: ${preValidation.isLeaseDocument}`);
  console.log(`   isIncompleteTemplate: ${preValidation.isIncompleteTemplate}`);
  console.log(`   qualityScore: ${preValidation.documentQualityScore}`);
  console.log(`   hasActualRentAmount: ${preValidation.hasActualRentAmount}`);
  console.log(`   hasActualAddress: ${preValidation.hasActualAddress}`);
  console.log(`   unchangedCount: ${preValidation.unchangedCount}`);
  console.log(`   placeholderCount: ${preValidation.placeholderCount}`);
  if (preValidation.issues.length > 0) {
    console.log(`   Issues: ${preValidation.issues.join("; ")}`);
  }
  
  if (!preValidation.isLeaseDocument) {
    console.warn(`⚠️ PRE-VALIDATION FAILED: Document does not appear to be a lease`);
    
    return {
      is_valid_lease: false,
      validation: {
        has_landlord: preValidation.hasLandlordMention,
        has_tenant: preValidation.hasTenantMention,
        has_premises: preValidation.hasPremisesMention,
        has_term: preValidation.hasTermMention,
        has_rent: preValidation.hasRentMention,
        missing_elements: preValidation.issues,
      },
      executive_summary: `NOT A LEASE DOCUMENT: This document does not appear to be a commercial lease agreement. It lacks basic lease terminology and structure.`,
      risk_score: 0,
      risk_level: "critical",
      strengths: [],
      concerns: [],
      high_risk_items: [{
        title: "Not a Lease Document",
        description: "This document does not contain the basic elements of a lease agreement.",
        current_text: "Document lacks lease terminology",
        priority: "critical",
        revised_language: "Please upload a commercial lease agreement for analysis.",
      }],
      missing_clauses: [],
      recommendations: [{
        priority: "critical",
        title: "Upload Valid Lease",
        current_text: "MISSING",
        suggested_change: "This document is not a lease. Please upload a commercial lease agreement.",
        risk_reduction: 100,
        difficulty: "hard",
      }],
      clauses: [],
      property_details: {
        address: "Not specified",
        property_type: "Unknown",
        lease_term: "Not specified",
        base_rent: "Not specified",
      },
      negotiation_priorities: {
        must_fix: ["Upload a valid lease document"],
        strongly_negotiate: [],
      },
      _aiModel: "pre-validation-rejection",
    };
  }
  
  // Handle incomplete templates - return a low score without calling AI
  // Only trigger this for CLEAR templates: 5+ [UNCHANGED] markers AND low quality score
  if (preValidation.isIncompleteTemplate && preValidation.unchangedCount >= 5 && preValidation.documentQualityScore < 25) {
    console.warn(`⚠️ INCOMPLETE TEMPLATE DETECTED: Document has ${preValidation.unchangedCount} [UNCHANGED] markers and lacks actual terms`);
    
    const missingItems: string[] = [];
    if (!preValidation.hasActualRentAmount) missingItems.push("Actual rent amount");
    if (!preValidation.hasActualAddress) missingItems.push("Actual property address");
    if (!preValidation.hasActualTermDates) missingItems.push("Actual lease term dates");
    if (preValidation.unchangedCount > 0) missingItems.push(`${preValidation.unchangedCount} sections marked [UNCHANGED]`);
    
    return {
      is_valid_lease: true,
      validation: {
        has_landlord: preValidation.hasLandlordMention,
        has_tenant: preValidation.hasTenantMention,
        has_premises: preValidation.hasPremisesMention,
        has_term: preValidation.hasTermMention,
        has_rent: preValidation.hasRentMention,
        missing_elements: preValidation.issues,
      },
      executive_summary: `INCOMPLETE TEMPLATE: This document appears to be a lease template with placeholder text rather than an executed lease with actual terms. It contains ${preValidation.unchangedCount} [UNCHANGED] markers and ${preValidation.placeholderCount} placeholder brackets. Critical terms like rent amount, property address, and lease dates are missing or not specified. This document cannot be properly evaluated until actual terms are filled in.`,
      risk_score: Math.max(5, Math.min(25, preValidation.documentQualityScore)),
      risk_level: "critical",
      strengths: [],
      concerns: [{
        title: "Incomplete Template Document",
        description: "This lease contains placeholder text and [UNCHANGED] markers instead of actual negotiated terms.",
        risk_level: "high",
        current_text: "[UNCHANGED] markers found throughout document",
        article_reference: "Multiple sections",
        revised_language: "Fill in all placeholder sections with actual negotiated terms.",
      }],
      high_risk_items: [{
        title: "No Actual Lease Terms",
        description: `Document is missing critical terms: ${missingItems.join(", ")}. Cannot evaluate a lease without actual terms.`,
        current_text: "Multiple [UNCHANGED] and placeholder sections",
        priority: "critical",
        revised_language: "Complete all sections with actual negotiated terms before analysis.",
      }],
      missing_clauses: [
        { clause_type: "Actual Rent Amount", importance: "critical", risk_if_missing: "Cannot evaluate financial terms without knowing the rent" },
        { clause_type: "Actual Property Address", importance: "critical", risk_if_missing: "Cannot evaluate without knowing the property" },
        { clause_type: "Actual Lease Term", importance: "critical", risk_if_missing: "Cannot evaluate without knowing the term length" },
      ],
      recommendations: [{
        priority: "critical",
        title: "Complete the Lease Template",
        current_text: "MISSING - Multiple sections have [UNCHANGED] or placeholder text",
        suggested_change: "Fill in all sections with actual negotiated terms, including rent amount, property address, lease term, and all [UNCHANGED] sections.",
        risk_reduction: 75,
        difficulty: "hard",
      }],
      clauses: [],
      property_details: {
        address: "Not specified - placeholder",
        property_type: "Unknown",
        lease_term: "Not specified - placeholder",
        base_rent: "Not specified - placeholder",
      },
      negotiation_priorities: {
        must_fix: [
          "Fill in actual rent amount",
          "Specify actual property address", 
          "Define actual lease term dates",
          "Complete all [UNCHANGED] sections"
        ],
        strongly_negotiate: [],
      },
      _aiModel: "incomplete-template-detection",
    };
  }
  
  console.log(`✅ PRE-VALIDATION PASSED: Document appears to be a complete lease`);
  
  // Build the comprehensive analysis prompt
  const systemPrompt = generateComprehensiveScoringPrompt();
  const userPrompt = `## LEASE DOCUMENT TO ANALYZE

${content}

Analyze this lease using the 1000-point framework. Evaluate EVERY category and item. Reference specific articles from the lease. Return the complete JSON analysis.`;

  const { response, model: aiModel } = await callLeaseAI(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      temperature: 0.1,
      maxTokens: 8192,
      jsonMode: true,
    }
  );
  
  console.log(`✅ AI Analysis completed using: ${aiModel}`);

  try {
    // Parse response
    let cleanedResponse = response.trim();
    
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    }
    
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedResponse = jsonMatch[0];
    }
    
    console.log(`[Parse] Parsing response (length: ${cleanedResponse.length})...`);
    
    const parsed = JSON.parse(cleanedResponse);
    
    // Extract the final score from the comprehensive analysis
    const finalScoreData = parsed.final_score || {};
    const pointsEarned = Math.round(finalScoreData.points_earned || 0);
    // Ensure percentage is always an integer (database requires integer type)
    const rawPercentage = finalScoreData.percentage || (pointsEarned / 1000) * 100;
    const percentage = Math.round(rawPercentage);
    
    // Determine risk level from percentage
    const riskLevel = getRiskLevelFromScore(percentage);
    const displayRiskLevel = riskLevel === "excellent" ? "low" : 
                            riskLevel === "good" ? "low" : 
                            riskLevel === "fair" ? "medium" : 
                            riskLevel === "poor" ? "high" : "critical";
    
    console.log(`📊 SCORING RESULTS:`);
    console.log(`   Points Earned: ${pointsEarned}/1000`);
    console.log(`   Percentage: ${percentage}%`);
    console.log(`   Tier: ${finalScoreData.tier || riskLevel}`);
    console.log(`   Risk Level: ${displayRiskLevel}`);
    
    // Normalize strengths to ensure they have the expected structure
    const normalizeStrengths = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => ({
        title: item.title || item.name || "Favorable Term",
        description: item.description || item.explanation || item.notes || "",
        article_reference: item.article_reference || item.reference || item.article || "",
      }));
    };
    
    // Normalize concerns to ensure they have the expected structure
    const normalizeConcerns = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => ({
        title: item.title || item.name || item.issue || "Concern",
        description: item.description || item.explanation || item.notes || "",
        risk_level: item.risk_level || item.severity || "medium",
        current_text: item.current_text || item.original_text || item.text || "",
        article_reference: item.article_reference || item.reference || item.article || "",
        revised_language: item.revised_language || item.suggested_fix || item.recommendation || "",
        economic_impact: item.economic_impact || item.impact || "",
        negotiability: item.negotiability || "moderate",
      }));
    };
    
    // Normalize high risk items to ensure they have the expected structure
    const normalizeHighRiskItems = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => ({
        title: item.title || item.name || item.issue || "High Risk Item",
        description: item.description || item.explanation || item.notes || "",
        priority: item.priority || item.severity || "high",
        current_text: item.current_text || item.original_text || item.text || "",
        article_reference: item.article_reference || item.reference || item.article || "",
        revised_language: item.revised_language || item.suggested_fix || item.recommendation || "",
        business_rationale: item.business_rationale || item.rationale || item.impact || "",
      }));
    };
    
    // Normalize recommendations to ensure they have the expected structure
    const normalizeRecommendations = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => ({
        priority: item.priority || item.severity || "medium",
        title: item.title || item.name || item.recommendation || "Recommendation",
        current_text: item.current_text || item.current_state || item.original_text || "",
        suggested_change: item.suggested_change || item.recommendation || item.suggested_text || "",
        risk_reduction: item.risk_reduction || item.points_impact || item.impact || 5,
        difficulty: item.difficulty || item.negotiation_difficulty || "moderate",
        business_rationale: item.business_rationale || item.rationale || "",
        trade_value: item.trade_value || "",
      }));
    };
    
    // Normalize missing clauses
    const normalizeMissingClauses = (items: any[]): any[] => {
      if (!Array.isArray(items)) return [];
      return items.map(item => ({
        clause_type: item.clause_type || item.name || item.title || "Missing Clause",
        importance: item.importance || item.priority || item.severity || "high",
        risk_if_missing: item.risk_if_missing || item.risk || item.description || "",
        suggested_language: item.suggested_language || item.suggested_text || item.recommendation || "",
        market_standard: item.market_standard || "",
      }));
    };
    
    // Extract issues from category_scores if main arrays are empty
    let strengths = normalizeStrengths(parsed.strengths || []);
    let concerns = normalizeConcerns(parsed.concerns || []);
    let highRiskItems = normalizeHighRiskItems(parsed.high_risk_items || []);
    let recommendations = normalizeRecommendations(parsed.recommendations || []);
    let missingClauses = normalizeMissingClauses(parsed.missing_clauses || []);
    
    // If arrays are empty, try to extract from category_scores
    if (concerns.length === 0 && highRiskItems.length === 0 && parsed.category_scores) {
      console.log("⚠️ Main arrays empty, extracting from category_scores...");
      
      for (const category of parsed.category_scores || []) {
        // Extract major issues from each category
        if (category.major_issues && Array.isArray(category.major_issues)) {
          for (const issue of category.major_issues) {
            if (typeof issue === 'string') {
              concerns.push({
                title: issue,
                description: `Issue in ${category.category_name}`,
                risk_level: "medium",
                current_text: "",
                article_reference: "",
                revised_language: "",
              });
            }
          }
        }
        
        // Extract failed items as concerns/high risk
        if (category.items && Array.isArray(category.items)) {
          for (const item of category.items) {
            if (item.status === "FAIL") {
              const issueItem = {
                title: item.check || item.id,
                description: item.notes || `Failed check in ${category.category_name}`,
                current_text: "",
                article_reference: item.article_reference || "",
                revised_language: "",
              };
              
              if (item.points_possible >= 20) {
                highRiskItems.push({
                  ...issueItem,
                  priority: "high",
                  business_rationale: `Missing ${item.points_possible} points`,
                });
              } else {
                concerns.push({
                  ...issueItem,
                  risk_level: "medium",
                });
              }
            } else if (item.status === "PARTIAL") {
              concerns.push({
                title: item.check || item.id,
                description: item.notes || `Partial compliance in ${category.category_name}`,
                risk_level: "medium",
                current_text: "",
                article_reference: item.article_reference || "",
                revised_language: "",
              });
            } else if (item.status === "PASS") {
              strengths.push({
                title: item.check || item.id,
                description: item.notes || `Compliant in ${category.category_name}`,
                article_reference: item.article_reference || "",
              });
            }
          }
        }
      }
      
      console.log(`📊 Extracted from category_scores: ${strengths.length} strengths, ${concerns.length} concerns, ${highRiskItems.length} high risk items`);
    }
    
    // Also extract from critical_deficiencies if available
    if (parsed.critical_deficiencies && Array.isArray(parsed.critical_deficiencies)) {
      for (const deficiency of parsed.critical_deficiencies) {
        // Check if not already in high_risk_items
        const exists = highRiskItems.some(h => h.title === deficiency.title);
        if (!exists) {
          highRiskItems.push({
            title: deficiency.title || "Critical Deficiency",
            description: deficiency.description || "",
            priority: "critical",
            current_text: "",
            article_reference: deficiency.article_reference || "",
            revised_language: deficiency.recommendation || "",
            business_rationale: deficiency.impact || "",
          });
        }
      }
    }
    
    // Build the result object with all the comprehensive data
    const result: LeaseAnalysisResult & { 
      _aiModel?: string; 
      scoring_details?: any; 
      category_scores?: any[];
      critical_deficiencies?: any[];
      surprisingly_favorable_provisions?: any[];
      final_assessment?: string;
    } = {
      is_valid_lease: true,
      executive_summary: parsed.executive_summary || `Lease analysis complete. Score: ${percentage}% (${pointsEarned}/1000 points).`,
      risk_score: percentage,
      risk_level: displayRiskLevel,
      strengths: strengths,
      concerns: concerns,
      high_risk_items: highRiskItems,
      missing_clauses: missingClauses,
      recommendations: recommendations,
      clauses: [],
      property_details: parsed.property_details || {},
      negotiation_priorities: parsed.negotiation_priorities || {},
      _aiModel: aiModel,
      scoring_details: {
        points_earned: pointsEarned,
        points_possible: 1000,
        percentage: percentage,
        tier: finalScoreData.tier || riskLevel
      },
      category_scores: parsed.category_scores || [],
      critical_deficiencies: parsed.critical_deficiencies || [],
      surprisingly_favorable_provisions: parsed.surprisingly_favorable_provisions || [],
      final_assessment: parsed.final_assessment
    };
    
    // Log analysis summary
    const totalIssues = 
      (result.concerns?.length || 0) + 
      (result.high_risk_items?.length || 0) + 
      (result.missing_clauses?.length || 0) +
      (result.critical_deficiencies?.length || 0);
    
    console.log(`📊 ANALYSIS COMPLETE:`);
    console.log(`   Score: ${percentage}% (${pointsEarned}/1000 points)`);
    console.log(`   Tier: ${finalScoreData.tier || riskLevel}`);
    console.log(`   Risk Level: ${displayRiskLevel}`);
    console.log(`   Strengths: ${result.strengths?.length || 0}`);
    console.log(`   Concerns: ${result.concerns?.length || 0}`);
    console.log(`   High Risk Items: ${result.high_risk_items?.length || 0}`);
    console.log(`   Missing Clauses: ${result.missing_clauses?.length || 0}`);
    console.log(`   Recommendations: ${result.recommendations?.length || 0}`);
    console.log(`   Total Issues: ${totalIssues}`);
    
    // Log first few items for debugging
    if (result.concerns && result.concerns.length > 0 && result.concerns[0]) {
      console.log(`   First concern: "${result.concerns[0].title}"`);
    }
    if (result.high_risk_items && result.high_risk_items.length > 0 && result.high_risk_items[0]) {
      console.log(`   First high risk: "${result.high_risk_items[0].title}"`);
    }
    
    return result;
    
  } catch (error) {
    console.error("❌ Failed to parse lease analysis results:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Failed to parse AI response as JSON")) {
        throw error;
      }
      const enhancedError = new Error(`Failed to parse lease analysis results: ${error.message}`);
      (enhancedError as any).originalError = error;
      throw enhancedError;
    }
    throw new Error(`Failed to parse lease analysis results: ${String(error)}`);
  }
}

// ============================================================
// SUPPORTING FUNCTIONS
// ============================================================

export async function extractClauses(content: string): Promise<ClauseExtraction[]> {
  const prompt = `${ATTORNEY_IDENTITY}

Extract and analyze ALL significant clauses from this lease document.

LEASE CONTENT:
${content}

Return a JSON array of clauses:
[
  {
    "category": "Financial|Legal & Risk|Operational|Termination & Default",
    "clause_type": "Clause name",
    "original_text": "Exact text from document (brief)",
    "plain_english_explanation": "Business impact explanation",
    "risk_impact": <-50 to +50, negative = bad for tenant>,
    "is_standard": true|false,
    "article_reference": "Article X.X",
    "recommendations": ["Specific negotiation suggestions"]
  }
]

Be thorough and reference specific articles.`;

  const response = await callGoogleAI(
    [
      { role: "system", content: ATTORNEY_IDENTITY },
      { role: "user", content: prompt },
    ],
    {
      temperature: 0.1,
      maxTokens: 8000,
      jsonMode: true,
    }
  );

  try {
    const parsed = JSON.parse(response);
    return Array.isArray(parsed) ? parsed : parsed.clauses || [];
  } catch (error) {
    console.error("Failed to parse clause extraction:", error);
    return [];
  }
}

export async function quickRiskAssessment(content: string): Promise<RiskAssessment> {
  const prompt = `${ATTORNEY_IDENTITY}

Quickly assess this lease's risk profile from the tenant's perspective using the 1000-point framework.

LEASE CONTENT (excerpt):
${content.substring(0, 8000)}

Return JSON:
{
  "risk_score": <0-100, based on estimated 1000-point score>,
  "risk_level": "low|medium|high|critical",
  "estimated_points": <estimated points out of 1000>,
  "top_concerns": ["Most material issues with article references"],
  "quick_summary": "2-3 sentence assessment",
  "immediate_red_flags": ["Any deal-breakers with specific references"]
}`;

  const response = await callGoogleAI(
    [
      { role: "system", content: ATTORNEY_IDENTITY },
      { role: "user", content: prompt },
    ],
    {
      temperature: 0.1,
      maxTokens: 1000,
      jsonMode: true,
    }
  );

  try {
    return JSON.parse(response) as RiskAssessment;
  } catch {
    return {
      risk_score: 40,
      risk_level: "high",
      top_concerns: ["Unable to assess - manual review required"],
      quick_summary: "Analysis pending - assume high risk",
    };
  }
}

export async function askLeaseQuestion(
  leaseContent: string,
  question: string
): Promise<string> {
  const prompt = `Based on this commercial lease document, answer the following question.

LEASE CONTENT:
${leaseContent}

QUESTION:
${question}

Provide a precise, actionable answer. Reference specific articles and sections. If the information isn't in the lease, explain the implications.`;

  return callGoogleAI(
    [
      { role: "system", content: ATTORNEY_IDENTITY },
      { role: "user", content: prompt },
    ],
    {
      temperature: 0.2,
      maxTokens: 1500,
    }
  );
}

export async function generateNegotiationCheatSheet(
  analysisResult: LeaseAnalysisResult
): Promise<string> {
  const prompt = `${ATTORNEY_IDENTITY}

Based on this comprehensive lease analysis, generate a detailed negotiation cheat sheet.

ANALYSIS:
${JSON.stringify(analysisResult, null, 2)}

Format as:
1. TOP 5 MUST-FIX ITEMS (with exact ask, fallback position, and article reference)
2. OPENING POSITION (strongest negotiating stance)
3. WALK-AWAY POINTS (deal-breakers that cannot be compromised)
4. TRADE CHIPS (items to concede for priority wins)
5. KEY TALKING POINTS (business rationale for main asks)
6. ESTIMATED SCORE IMPROVEMENT (points gained if successful)

Be direct, specific, and actionable.`;

  return callGoogleAI(
    [
      { role: "system", content: ATTORNEY_IDENTITY },
      { role: "user", content: prompt },
    ],
    {
      temperature: 0.2,
      maxTokens: 3000,
    }
  );
}

// Export the attorney identity for use in other modules
export { ATTORNEY_IDENTITY };
