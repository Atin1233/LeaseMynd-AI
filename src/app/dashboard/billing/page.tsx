"use client";
import { useEffect, useState } from "react";
import { createClient } from "~/lib/supabase/client";
import { PLANS, type PlanId } from "~/lib/stripe";
import { Check, Loader2, CreditCard, Zap } from "lucide-react";
import { useToast } from "~/lib/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  plan: string;
  monthly_analysis_limit: number;
  analyses_used_this_month: number;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
}

export default function BillingPage() {
  const toast = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    loadOrganization();

    // Check for success/canceled params
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Reload to show updated plan
      setTimeout(() => {
        loadOrganization();
      }, 2000);
    }
  }, []);

  async function loadOrganization() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = (profile as { organization_id?: string } | null)?.organization_id;
    if (orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (org) setOrganization(org as unknown as Organization);
    }

    setLoading(false);
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(planId);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout", {
          description: data.error || "Please try again",
        });
        setUpgrading(null);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to start checkout", {
        description: "Please try again",
      });
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to open billing portal", {
          description: data.error || "Please try again",
        });
        setManagingBilling(false);
      }
    } catch (error) {
      console.error("Portal error:", error);
      toast.error("Failed to open billing portal", {
        description: "Please try again",
      });
      setManagingBilling(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const currentPlan = organization?.plan?.toUpperCase() || "FREE";
  const usagePercent = organization
    ? Math.min(
        100,
        (organization.analyses_used_this_month / organization.monthly_analysis_limit) * 100
      )
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-stone-600">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="bg-white border border-stone-200 rounded-none p-8 mb-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-sm text-stone-500 mb-1">Current Plan</p>
            <h2 className="text-2xl font-semibold text-stone-900">
              {PLANS[currentPlan as PlanId]?.name || "Free"} Plan
            </h2>
            {organization?.stripe_subscription_status && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium mt-2 ${
                  organization.stripe_subscription_status === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {organization.stripe_subscription_status}
              </span>
            )}
          </div>

          {organization?.stripe_subscription_id && (
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-none text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {managingBilling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Manage Billing
            </button>
          )}
        </div>

        {/* Usage Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-stone-600">Monthly Usage</span>
            <span className="text-stone-900 font-medium">
              {organization?.analyses_used_this_month || 0} /{" "}
              {organization?.monthly_analysis_limit === -1
                ? "Unlimited"
                : organization?.monthly_analysis_limit === -1 ? "Unlimited" : organization?.monthly_analysis_limit || 3}{" "}
              analyses
            </span>
          </div>
          <div className="h-2 bg-stone-100 rounded-none overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                usagePercent > 80 ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">
          Available Plans
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrentPlan = currentPlan === key;
            const isUpgrade =
              PLANS[currentPlan as PlanId]?.price < plan.price;

            return (
              <div
                key={key}
                className={`relative bg-white border rounded-none p-6 ${
                  isCurrentPlan
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-stone-200"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-none">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-stone-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-stone-900">
                    ${plan.price}
                  </span>
                  <span className="text-stone-500">/month</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrentPlan && plan.priceId && (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-none font-medium transition-colors disabled:opacity-50 ${
                      isUpgrade
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-stone-300 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {upgrading === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        {isUpgrade ? "Upgrade" : "Switch"}
                      </>
                    )}
                  </button>
                )}

                {isCurrentPlan && (
                  <div className="text-center text-sm text-stone-500 py-2.5">
                    Your current plan
                  </div>
                )}

                {!isCurrentPlan && !plan.priceId && (
                  <div className="text-center text-sm text-stone-500 py-2.5">
                    Free tier
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-stone-50 border border-stone-200 rounded-none p-8">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-stone-900 mb-1">
              Can I cancel anytime?
            </h4>
            <p className="text-sm text-stone-600">
              Yes, you can cancel your subscription at any time. You&apos;ll
              continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-stone-900 mb-1">
              What happens if I exceed my monthly limit?
            </h4>
            <p className="text-sm text-stone-600">
              You can upgrade your plan at any time to get more analyses.
              Overage charges of $25 per additional analysis apply if you exceed
              your limit.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-stone-900 mb-1">
              Do you offer refunds?
            </h4>
            <p className="text-sm text-stone-600">
              We offer a 14-day money-back guarantee. If you&apos;re not
              satisfied, contact us for a full refund.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

