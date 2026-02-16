import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Lazy-initialized Stripe client (avoids build-time init when env is missing). */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Pricing Plans Configuration
export const PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    description: "Try LeaseAI with limited features",
    price: 0,
    priceId: null,
    features: [
      "Unlimited lease analyses",
      "Basic risk scoring",
      "Email support",
    ],
    limits: {
      analysesPerMonth: -1, // Unlimited
      teamMembers: 1,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  SINGLE: {
    id: "single",
    name: "Single",
    description: "For individual brokers and small business owners",
    price: 149,
    priceId: process.env.STRIPE_SINGLE_PRICE_ID,
    features: [
      "5 lease analyses per month",
      "Advanced risk scoring & recommendations",
      "Standard PDF reports",
      "Email support",
      "1 user account",
    ],
    limits: {
      analysesPerMonth: 5,
      teamMembers: 1,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  TEAM: {
    id: "team",
    name: "Team",
    description: "For small teams and property managers",
    price: 399,
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    features: [
      "20 lease analyses per month",
      "Advanced risk scoring with benchmarking",
      "Team collaboration (5 users)",
      "Priority support & chat",
      "API access (100 requests/day)",
      "Market comparison reports",
    ],
    limits: {
      analysesPerMonth: 20,
      teamMembers: 5,
      apiAccess: true,
      whiteLabel: false,
    },
  },
  BROKER: {
    id: "broker",
    name: "Broker",
    description: "For commercial brokers and agencies",
    price: 799,
    priceId: process.env.STRIPE_BROKER_PRICE_ID,
    features: [
      "Unlimited lease analyses",
      "White-label branding & custom domain",
      "Client sharing portals",
      "Team collaboration (20 users)",
      "Advanced analytics & reporting",
      "API access (1000 requests/day)",
      "Dedicated account manager",
    ],
    limits: {
      analysesPerMonth: -1, // Unlimited
      teamMembers: 20,
      apiAccess: true,
      whiteLabel: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];

// Get plan by ID
export function getPlan(planId: string): Plan | undefined {
  const normalizedId = planId.toUpperCase() as PlanId;
  return PLANS[normalizedId];
}

// Get plan limits
export function getPlanLimits(planId: string) {
  const plan = getPlan(planId);
  return plan?.limits ?? PLANS.FREE.limits;
}

