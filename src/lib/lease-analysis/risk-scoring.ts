/**
 * Risk Scoring Utilities
 * 
 * This module provides utility functions for risk level display and formatting.
 * The actual scoring logic is now handled by the 1000-point framework in scoring-framework.ts
 */

import type { RiskLevel } from "./types";

export interface RiskCalculationResult {
  totalScore: number;
  riskLevel: RiskLevel;
  breakdown: {
    category: string;
    score: number;
    weight: number;
    weightedScore: number;
    issues: string[];
  }[];
  missingClausePenalties: {
    clauseType: string;
    penalty: number;
  }[];
  highRiskItems: {
    clauseType: string;
    impact: number;
    reason: string;
  }[];
  criticalIssues: string[];
  positiveFactors: string[];
  detailedScoring: {
    factor: string;
    impact: number;
    found_in: string;
  }[];
}

/**
 * Convert numeric score (0-100) to risk level
 * Based on the 1000-point framework interpretation:
 * - 90-100%: excellent → "low"
 * - 80-89%: good → "low"
 * - 70-79%: fair → "medium"
 * - 60-69%: poor → "high"
 * - Below 60%: critical → "critical"
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 70) return "medium";
  if (score >= 60) return "high";
  return "critical";
}

/**
 * Get risk level color for UI display
 */
export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "#16a34a"; // Green
    case "medium":
      return "#d97706"; // Amber
    case "high":
      return "#dc2626"; // Red
    case "critical":
      return "#7f1d1d"; // Dark red
    default:
      return "#6b7280"; // Gray
  }
}

/**
 * Get risk level label for display
 */
export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "Good - Favorable Terms";
    case "medium":
      return "Fair - Some Concerns";
    case "high":
      return "Poor - Needs Negotiation";
    case "critical":
      return "Critical - Major Issues";
    default:
      return "Unknown Risk Level";
  }
}

/**
 * Get extended risk description based on score
 */
export function getRiskDescription(score: number): string {
  if (score >= 90) {
    return "Excellent - Market-leading lease terms with comprehensive protections";
  }
  if (score >= 80) {
    return "Good - Above-average terms with minor negotiation opportunities";
  }
  if (score >= 70) {
    return "Fair - Standard market terms with several areas requiring attention";
  }
  if (score >= 60) {
    return "Poor - Below-market terms with significant risks requiring immediate negotiation";
  }
  return "Critical - Unacceptable risk profile, fundamental restructuring required";
}

/**
 * Generate improvement recommendations based on score
 * This is a simplified version that works with the new scoring system
 */
export function generateImprovementRecommendations(
  result: RiskCalculationResult
): string[] {
  const recommendations: string[] = [];

  // Add general recommendation based on score
  if (result.totalScore < 60) {
    recommendations.push(
      "⚠️ CRITICAL: This lease has major issues. Do not sign without significant revisions."
    );
  } else if (result.totalScore < 70) {
    recommendations.push(
      "⚠️ HIGH RISK: Consult with a real estate attorney before signing."
    );
  } else if (result.totalScore < 80) {
    recommendations.push(
      "⚠️ FAIR: Several areas need attention before signing."
    );
  }

  // Add critical issues
  for (const issue of result.criticalIssues.slice(0, 5)) {
    recommendations.push(`URGENT: ${issue}`);
  }

  // Add missing protections
  for (const missing of result.missingClausePenalties.slice(0, 5)) {
    recommendations.push(`Add ${missing.clauseType} clause`);
  }

  // Add high-risk items
  for (const highRisk of result.highRiskItems.slice(0, 5)) {
    recommendations.push(`Negotiate ${highRisk.clauseType} - ${highRisk.reason}`);
  }

  return recommendations;
}

/**
 * Legacy calculateRiskScore function
 * Now simply returns the AI-calculated score passed in
 * Kept for backwards compatibility with existing code
 */
export function calculateRiskScore(
  clauses: any[],
  concerns?: any[],
  highRiskItems?: any[]
): RiskCalculationResult {
  // This function is kept for backwards compatibility
  // The actual scoring is now done by the AI using the 1000-point framework
  
  console.log(`[risk-scoring] calculateRiskScore called with ${clauses.length} clauses`);
  console.log(`[risk-scoring] Note: Scoring is now handled by the 1000-point AI framework`);
  
  // Return a minimal result - the actual score comes from the AI
  return {
    totalScore: 0, // Will be overridden by AI score
    riskLevel: "critical",
    breakdown: [],
    missingClausePenalties: [],
    highRiskItems: [],
    criticalIssues: [],
    positiveFactors: [],
    detailedScoring: [],
  };
}
