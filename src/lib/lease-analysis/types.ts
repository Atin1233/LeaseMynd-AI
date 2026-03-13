export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Priority = "critical" | "high" | "medium" | "low";
export type Difficulty = "easy" | "medium" | "hard";
export type Impact = "positive" | "neutral" | "negative";
export type EconomicImpact = "one-time" | "ongoing" | "catastrophic";
export type Negotiability = "easy" | "moderate" | "hard";
export type Importance = "critical" | "high" | "medium";

export interface LeaseValidation {
  has_landlord: boolean;
  has_tenant: boolean;
  has_premises: boolean;
  has_term: boolean;
  has_rent: boolean;
  missing_elements?: string[];
}

export interface LeaseAnalysisResult {
  is_valid_lease?: boolean;
  validation?: LeaseValidation;
  executive_summary: string;
  risk_score: number;
  risk_level: RiskLevel;
  overall_assessment?: string;
  strengths: StrengthItem[];
  concerns: ConcernItem[];
  high_risk_items: HighRiskItem[];
  recommendations: Recommendation[];
  clauses: ClauseExtraction[];
  property_details?: PropertyDetails;
  missing_clauses?: MissingClause[];
  negotiation_priorities?: NegotiationPriorities;
  financial_analysis?: FinancialAnalysis;
}

export interface FinancialAnalysis {
  total_occupancy_cost_estimate?: string;
  hidden_costs_identified?: string[];
  cost_escalation_risk?: string;
}

export interface StrengthItem {
  title: string;
  description: string;
  impact?: "positive";
  clause_reference?: string;
  article_reference?: string;
  current_text?: string;
  market_comparison?: string;
}

export interface ConcernItem {
  title: string;
  description: string;
  impact?: "neutral";
  current_text?: string;
  article_reference?: string;
  risk_level?: RiskLevel;
  economic_impact?: EconomicImpact;
  negotiability?: Negotiability;
  revised_language?: string;
  business_rationale?: string;
  negotiation_strategy?: string;
  fallback_position?: string;
}

export interface HighRiskItem {
  title: string;
  description: string;
  impact?: "negative";
  priority: Priority;
  current_text?: string;
  article_reference?: string;
  risk_level?: "high" | "critical";
  economic_impact?: EconomicImpact;
  litigation_exposure?: string;
  negotiability?: Negotiability;
  revised_language?: string;
  business_rationale?: string;
  negotiation_strategy?: string;
  fallback_position?: string;
  walk_away_threshold?: string;
}

export interface Recommendation {
  priority: Priority;
  title: string;
  current_text: string;
  suggested_change: string;
  risk_reduction: number;
  difficulty: Difficulty;
  business_rationale?: string;
  trade_value?: string;
}

export interface ClauseExtraction {
  category: string;
  subcategory?: string;
  clause_type: string;
  original_text: string;
  plain_english_explanation?: string;
  risk_impact?: number;
  is_standard?: boolean;
  market_comparison?: string;
  litigation_risk?: string;
  page_estimate?: number | null;
  page_numbers?: number[];
  concerns?: string[];
  recommendations?: string[];
  risk_factors?: Record<string, unknown>[];
}

export interface PropertyDetails {
  address?: string;
  property_type?: string;
  square_footage?: string;
  lease_term?: string;
  commencement_date?: string;
  expiration_date?: string;
  base_rent?: string;
  monthly_rent?: string;
  rent_escalation?: string;
  security_deposit?: string;
  tenant_improvement_allowance?: string;
}

export interface MissingClause {
  clause_type: string;
  importance: Importance | string;
  risk?: string;
  risk_if_missing?: string;
  standard_market_term?: string;
  market_standard?: string;
  suggested_language?: string;
}

export interface NegotiationPriorities {
  must_fix?: string[];
  strongly_negotiate?: string[];
  nice_to_have?: string[];
  accept_as_is?: string[];
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: RiskLevel;
  top_concerns: string[];
  quick_summary: string;
  immediate_red_flags?: string[];
}

// Database-aligned types
export interface LeaseAnalysisInsert {
  lease_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  executive_summary: string;
  strengths: StrengthItem[];
  concerns: ConcernItem[];
  high_risk_items: HighRiskItem[];
  recommendations: Recommendation[];
  market_comparison?: Record<string, unknown>;
  analysis_metadata?: Record<string, unknown>;
  processing_time_ms?: number;
  ai_model?: string;
}

export interface ClauseExtractionInsert {
  lease_id: string;
  analysis_id?: string;
  category: string;
  subcategory?: string;
  clause_type: string;
  original_text: string;
  plain_english_explanation?: string;
  risk_impact?: number;
  risk_factors?: Record<string, unknown>[];
  page_numbers?: number[];
  is_standard?: boolean;
  recommendations?: string[];
}
