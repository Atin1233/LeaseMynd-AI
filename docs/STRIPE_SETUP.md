# Stripe Setup Guide

This guide walks through configuring Stripe for subscription billing (Single $149, Team $399, Broker $799).

**Note:** There is no free plan. All users must subscribe to a paid plan.

## 1. Create a Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Switch to **Test mode** (toggle in Dashboard) for development

## 2. Create Products and Prices

In [Stripe Dashboard → Products](https://dashboard.stripe.com/products):

### Single Plan – $149/month
- **Name:** Single
- **Description:** 5 lease analyses per month • Advanced risk scoring & recommendations • Standard PDF reports • Email support • 1 user account
- Click **Add product**
- **Pricing:** Recurring, $149/month
- Copy the **Price ID** (starts with `price_`) → `STRIPE_SINGLE_PRICE_ID`

### Team Plan – $399/month
- **Name:** Team
- **Description:** 20 lease analyses per month • Advanced risk scoring with benchmarking • Team collaboration (5 users) • Priority support & chat • API access (100 requests/day) • Market comparison reports
- **Pricing:** Recurring, $399/month
- Copy the **Price ID** → `STRIPE_TEAM_PRICE_ID`

### Broker Plan – $799/month
- **Name:** Broker
- **Description:** Unlimited lease analyses • White-label branding & custom domain • Client sharing portals • Team collaboration (20 users) • Advanced analytics & reporting • API access (1000 requests/day) • Dedicated account manager
- **Pricing:** Recurring, $799/month
- Copy the **Price ID** → `STRIPE_BROKER_PRICE_ID`

## 3. Get API Keys

1. [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
2. Copy **Secret key** (sk_test_... or sk_live_...) → `STRIPE_SECRET_KEY`
3. Copy **Publishable key** (pk_test_... or pk_live_...) → `STRIPE_PUBLISHABLE_KEY`

## 4. Configure Webhook

1. [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**
3. **Endpoint URL:** `https://yourdomain.com/api/stripe/webhook`  
   - Local: use [Stripe CLI](#5-local-webhook-with-stripe-cli-optional) or deploy to a public URL
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (whsec_...) → `STRIPE_WEBHOOK_SECRET`

## 5. Local Webhook (Stripe CLI, optional)

For local testing:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a `whsec_...` secret; use that as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## 6. Environment Variables

Add to `.env.local`:

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_SINGLE_PRICE_ID="price_..."
STRIPE_TEAM_PRICE_ID="price_..."
STRIPE_BROKER_PRICE_ID="price_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For production, set `NEXT_PUBLIC_APP_URL` to your domain.

## 7. Database (Supabase)

Ensure the `organizations` table has Stripe columns. If not, run:

```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'single';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monthly_analysis_limit INTEGER DEFAULT -1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS analyses_used_this_month INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ;
```

(Adjust if your schema already has these.)

## 8. Billing Portal (Stripe Dashboard)

1. [Stripe Dashboard → Settings → Billing → Customer portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable **Customer portal**
3. Configure allowed actions (e.g. cancel, update payment method)

## 9. Test the Flow

1. Sign in to the app
2. Go to **Dashboard → Billing**
3. Click **Upgrade** on Single, Team, or Broker
4. Use test card `4242 4242 4242 4242` and any future expiry/CVC
5. After checkout, the webhook should update the organization plan

## Troubleshooting

- **"This plan is not available for purchase"** – Price ID env vars are missing or invalid
- **Webhook signature verification failed** – Wrong `STRIPE_WEBHOOK_SECRET` or webhook URL
- **No billing account found** – User must complete checkout before using Manage Billing
