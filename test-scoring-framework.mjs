import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Simple test lease content
const TEST_LEASE = `
COMMERCIAL LEASE AGREEMENT

This Commercial Lease Agreement ("Lease") is made and entered into as of January 1, 2024,
by and between ABC Properties LLC ("Landlord") and XYZ Corporation ("Tenant").

1. PREMISES
Landlord hereby leases to Tenant the premises located at 123 Main Street, Suite 500,
San Francisco, CA 94102, consisting of approximately 5,000 rentable square feet ("Premises").

2. TERM
The initial term of this Lease shall be for a period of five (5) years, commencing on
January 1, 2024 and expiring on December 31, 2028.

3. BASE RENT
Tenant shall pay to Landlord base rent of $15,000.00 per month ($36.00 per rentable square foot per year).
Rent shall be due and payable on the first day of each calendar month.

4. RENT ESCALATION
Base rent shall increase by 3% annually on each anniversary of the Commencement Date.

5. SECURITY DEPOSIT
Tenant shall deposit with Landlord the sum of $30,000.00 as a security deposit.

6. OPERATING EXPENSES (CAM)
Tenant shall pay Tenant's proportionate share of Operating Expenses. Landlord shall provide
an annual reconciliation within 90 days of year end. Tenant shall have the right to audit
Landlord's records upon reasonable notice.

7. RENEWAL OPTION
Tenant shall have the option to renew this Lease for one (1) additional five (5) year term
upon written notice to Landlord no less than 180 days prior to the expiration of the initial term.
The renewal rent shall be at 95% of the then-prevailing market rate.

8. MAINTENANCE AND REPAIRS
Landlord shall be responsible for structural repairs, roof, and building systems.
Tenant shall maintain the interior of the Premises in good condition.

9. ALTERATIONS
Tenant may make non-structural alterations with Landlord's prior written consent,
which consent shall not be unreasonably withheld or delayed.

10. ASSIGNMENT AND SUBLETTING
Tenant may assign this Lease or sublet the Premises with Landlord's consent,
which shall not be unreasonably withheld. Landlord shall respond within 30 days.

11. DEFAULT AND REMEDIES
Tenant shall be in default if Tenant fails to pay rent within 10 days after written notice.
For non-monetary defaults, Tenant shall have 30 days to cure after written notice.

12. INSURANCE
Tenant shall maintain commercial general liability insurance of at least $1,000,000 per occurrence.
Both parties waive subrogation rights against each other.

13. INDEMNIFICATION
Each party shall indemnify and hold harmless the other party from claims arising from
that party's negligence or willful misconduct.

14. QUIET ENJOYMENT
Landlord covenants that Tenant, upon paying rent and performing its obligations,
shall peacefully and quietly enjoy the Premises.

15. FORCE MAJEURE
Neither party shall be liable for delays caused by events beyond reasonable control,
including pandemics, natural disasters, or government actions.

16. EARLY TERMINATION
Tenant may terminate this Lease after the third year upon 180 days written notice
and payment of 6 months' rent as a termination fee.
`;

async function testScoringFramework() {
  console.log("=== Testing New 1000-Point Scoring Framework ===\n");
  
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GOOGLE_AI_API_KEY not found");
    process.exit(1);
  }
  
  console.log("✅ API Key found\n");
  
  // Build the scoring prompt (simplified version for testing)
  const systemPrompt = `You are the #1 ranked commercial real estate attorney in the United States, specializing in contract law and real estate lease agreements.

Analyze this lease using a 1000-point scoring framework. Evaluate each area and calculate the total score.

SCORING CATEGORIES (simplified for test):
1. Essential Terms (150 pts): Landlord, tenant, premises, term, rent clearly identified
2. Financial Protections (150 pts): Reasonable rent escalation, CAM audit rights, expense caps
3. Tenant Rights (150 pts): Renewal option, early termination, assignment rights
4. Risk & Liability (150 pts): Maintenance clear, mutual indemnification, cure periods
5. Missing Protections (200 pts): Force majeure, quiet enjoyment, insurance waivers
6. One-Sidedness (200 pts): Reasonableness standards, balanced provisions

Total Possible: 1000 points
Score = (Points Earned / 1000) × 100 = Percentage`;

  const userPrompt = `LEASE TO ANALYZE:

${TEST_LEASE}

Return JSON with:
{
  "total_points_earned": <number>,
  "percentage_score": <0-100>,
  "risk_level": "excellent|good|fair|poor|critical",
  "category_breakdown": {
    "essential_terms": {"points": <0-150>, "notes": "brief"},
    "financial_protections": {"points": <0-150>, "notes": "brief"},
    "tenant_rights": {"points": <0-150>, "notes": "brief"},
    "risk_liability": {"points": <0-150>, "notes": "brief"},
    "missing_protections": {"points": <0-200>, "notes": "brief"},
    "one_sidedness": {"points": <0-200>, "notes": "brief"}
  },
  "executive_summary": "2 sentences",
  "top_strengths": ["max 3"],
  "top_concerns": ["max 3"]
}`;

  try {
    console.log("Sending analysis request to Gemini...\n");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
      },
      systemInstruction: systemPrompt,
    });
    
    const startTime = Date.now();
    const result = await model.generateContent(userPrompt);
    const elapsed = Date.now() - startTime;
    
    const responseText = result.response.text();
    
    console.log(`Response received in ${elapsed}ms\n`);
    console.log("=== ANALYSIS RESULT ===\n");
    
    try {
      const parsed = JSON.parse(responseText);
      
      console.log(`📊 SCORE: ${parsed.percentage_score}% (${parsed.risk_level?.toUpperCase()})`);
      console.log(`📈 Points: ${parsed.total_points_earned}/1000\n`);
      
      console.log("📋 Category Breakdown:");
      if (parsed.category_breakdown) {
        for (const [cat, data] of Object.entries(parsed.category_breakdown)) {
          console.log(`   - ${cat}: ${data.points} pts - ${data.notes}`);
        }
      }
      
      console.log(`\n📝 Summary: ${parsed.executive_summary}\n`);
      
      console.log("✅ Strengths:");
      (parsed.top_strengths || []).forEach((s, i) => console.log(`   ${i+1}. ${s}`));
      
      console.log("\n⚠️ Concerns:");
      (parsed.top_concerns || []).forEach((c, i) => console.log(`   ${i+1}. ${c}`));
      
      // Validate score expectations for this well-structured test lease
      console.log("\n=== VALIDATION ===");
      if (parsed.percentage_score >= 70 && parsed.percentage_score <= 95) {
        console.log("✅ Score is in expected range (70-95%) for this tenant-favorable lease");
      } else if (parsed.percentage_score < 70) {
        console.log("⚠️ Score seems low for this lease - may need prompt tuning");
      } else {
        console.log("⚠️ Score seems high - verify checklist evaluation");
      }
      
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      console.log("Raw response:", responseText);
    }
    
    console.log("\n✅ Test completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testScoringFramework();
