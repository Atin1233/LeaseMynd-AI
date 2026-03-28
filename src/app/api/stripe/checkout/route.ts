// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { getStripe, PLANS } from "~/lib/stripe";

export async function POST(request: Request) {
  try {
    console.log("[Stripe Checkout] Starting checkout process");
    console.log("[Stripe Checkout] STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();

    // Validate plan
    const normalizedPlanId = planId?.toUpperCase();
    if (!normalizedPlanId || !PLANS[normalizedPlanId as keyof typeof PLANS]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan = PLANS[normalizedPlanId as keyof typeof PLANS];

    console.log("Checkout plan:", plan.id, "Price ID:", plan.priceId);
    console.log("Env vars:", {
      SINGLE: process.env.STRIPE_SINGLE_PRICE_ID,
      TEAM: process.env.STRIPE_TEAM_PRICE_ID,
      BROKER: process.env.STRIPE_BROKER_PRICE_ID,
    });

    if (!plan.priceId) {
      return NextResponse.json(
        { error: `Plan ${plan.id} is not available for purchase. Price ID not configured.` },
        { status: 400 }
      );
    }

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found. Please complete your profile first." },
        { status: 400 }
      );
    }

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();
    
    if (orgError || !organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if organization already has a Stripe customer ID
    let customerId = organization?.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe customer
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.full_name ?? undefined,
        metadata: {
          organization_id: profile.organization_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to organization (will add this column via migration)
      await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", profile.organization_id);
    }

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
      metadata: {
        organization_id: profile.organization_id,
        plan_id: plan.id,
      },
      subscription_data: {
        metadata: {
          organization_id: profile.organization_id,
          plan_id: plan.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create checkout session", details: errorMessage },
      { status: 500 }
    );
  }
}

