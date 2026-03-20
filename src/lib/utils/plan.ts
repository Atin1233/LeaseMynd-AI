/**
 * Plan utilities for development and production
 */

/**
 * Get the default plan for new organizations
 * In development/localhost, default to broker plan (highest tier)
 * In production, default to single plan (lowest paid tier)
 */
export function getDefaultPlan(): "single" | "team" | "broker" {
  // In development/localhost, use broker plan (highest tier with all features)
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("127.0.0.1")
  ) {
    return "broker";
  }
  return "single";
}

/**
 * Get the default monthly analysis limit for a plan
 */
export function getDefaultAnalysisLimit(plan: string): number {
  if (plan === "broker") {
    return -1; // Unlimited
  }
  if (plan === "team") {
    return 20;
  }
  return 5; // Default to single plan
}
