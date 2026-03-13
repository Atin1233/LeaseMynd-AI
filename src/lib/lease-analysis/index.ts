// Lease Analysis Functions
export {
  analyzeLeaseDocument,
  extractClauses,
  quickRiskAssessment,
  askLeaseQuestion,
  generateNegotiationCheatSheet,
  ATTORNEY_IDENTITY,
} from "./lease-analyzer";

// Lease Redlining Functions
export {
  generateImprovedLease,
  generateRedlineChanges,
  generateCoverLetter,
  validateRedlineCompleteness,
} from "./lease-redliner";
export type { RedlineChange, RedlinedLease } from "./lease-redliner";

// Risk Scoring Utilities
export {
  getRiskLevel,
  getRiskColor,
  getRiskLabel,
  getRiskDescription,
  generateImprovementRecommendations,
  calculateRiskScore, // Kept for backwards compatibility
} from "./risk-scoring";
export type { RiskCalculationResult } from "./risk-scoring";

// 1000-Point Scoring Framework
export {
  SCORING_FRAMEWORK,
  getAllChecklistItems,
  getTotalChecklistItems,
  calculateScoreFromResults,
  getRiskLevelFromScore,
} from "./scoring-framework";
export type { ScoringItem, CategoryScore, ScoringResult } from "./scoring-framework";

// Type Exports
export type {
  RiskLevel,
  Priority,
  Difficulty,
  Impact,
  LeaseAnalysisResult,
  StrengthItem,
  ConcernItem,
  HighRiskItem,
  Recommendation,
  ClauseExtraction,
  PropertyDetails,
  MissingClause,
  NegotiationPriorities,
  FinancialAnalysis,
  RiskAssessment,
  LeaseAnalysisInsert,
  ClauseExtractionInsert,
} from "./types";
