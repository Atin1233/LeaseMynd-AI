import type { IPricing } from "~/data/landing/types";

export const tiers: IPricing[] = [
  {
    name: "Single",
    price: 149,
    features: [
      "5 lease analyses per month",
      "Risk scoring and recommendations",
      "Standard PDF reports",
      "Email support",
      "1 user account",
    ],
  },
  {
    name: "Team",
    price: 399,
    features: [
      "20 lease analyses per month",
      "Advanced risk scoring & benchmarking",
      "Team collaboration (5 users)",
      "Priority support",
      "API access (100 requests/day)",
    ],
  },
  {
    name: "Broker",
    price: 799,
    features: [
      "Unlimited lease analyses",
      "White-label branding & client sharing",
      "Team collaboration (20 users)",
      "Advanced analytics",
      "API access (1000 requests/day)",
      "Dedicated account manager",
    ],
  },
];
