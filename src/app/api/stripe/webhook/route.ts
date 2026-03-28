// @ts-nocheck - Supabase type inference issues
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe, PLANS } from "~/lib/stripe";
import { createAdminClient } from "~/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  const stripe = getStripe();
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient(); // Use admin client to bypass RLS

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id;
        const planId = session.metadata?.plan_id;

        if (organizationId && planId) {
          const plan = PLANS[planId.toUpperCase() as keyof typeof PLANS];
          
          await supabase
            .from("organizations")
            .update({
              plan: planId,
              stripe_subscription_id: session.subscription as string,
              monthly_analysis_limit: plan?.limits.analysesPerMonth ?? 5,
              billing_cycle_start: new Date().toISOString(),
              analyses_used_this_month: 0,
            })
            .eq("id", organizationId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (organizationId) {
          // Get the price ID to determine the plan
          const priceId = subscription.items.data[0]?.price.id;
          let planId = "single";

          // Map price ID to plan
          if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
            planId = "team";
          } else if (priceId === process.env.STRIPE_BROKER_PRICE_ID) {
            planId = "broker";
          }

          const plan = PLANS[planId.toUpperCase() as keyof typeof PLANS];

          await supabase
            .from("organizations")
            .update({
              plan: planId,
              stripe_subscription_status: subscription.status,
              monthly_analysis_limit: plan?.limits.analysesPerMonth ?? 5,
            })
            .eq("id", organizationId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const organizationId = subscription.metadata?.organization_id;

        if (organizationId) {
          // Mark subscription as canceled - organization will need to resubscribe
          await supabase
            .from("organizations")
            .update({
              stripe_subscription_id: null,
              stripe_subscription_status: "canceled",
              monthly_analysis_limit: 0, // No analyses allowed until resubscribed
            })
            .eq("id", organizationId);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Get subscription to find organization
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          const organizationId = subscription.metadata?.organization_id;

          if (organizationId) {
            // Reset monthly usage on successful payment (new billing cycle)
            await supabase
              .from("organizations")
              .update({
                analyses_used_this_month: 0,
                billing_cycle_start: new Date().toISOString(),
              })
              .eq("id", organizationId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.error("Payment failed for invoice:", invoice.id);
        // Could send notification email here
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

