/**
 * Plan utilities for development and production
 */

/**
 * Get the default plan for new organizations
 * In development/localhost, default to broker plan (highest tier)
 * In production, default to free plan
 */
export function getDefaultPlan(): "free" | "single" | "team" | "broker" {
  // In development/localhost, use broker plan (highest tier with all features)
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("localhost") ||
    process.env.NEXT_PUBLIC_APP_URL?.includes("127.0.0.1")
  ) {
    return "broker";
  }
  return "free";
}

/**
 * Get the default monthly analysis limit for a plan
 */
export function getDefaultAnalysisLimit(plan: string): number {
  if (plan === "broker" || plan === "free") {
    return -1; // Unlimited
  }
  if (plan === "team") {
    return 20;
  }
  if (plan === "single") {
    return 5;
  }
  return 3; // Default fallback
}
