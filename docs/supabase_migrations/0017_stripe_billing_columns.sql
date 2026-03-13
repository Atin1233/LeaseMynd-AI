-- Stripe billing columns for organizations
-- Run in Supabase SQL Editor. Requires: organizations table.
-- See docs/STRIPE_SETUP.md for full Stripe setup.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monthly_analysis_limit INTEGER DEFAULT -1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS analyses_used_this_month INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMPTZ;

COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN organizations.stripe_subscription_status IS 'active, canceled, past_due, etc.';
COMMENT ON COLUMN organizations.plan IS 'free | single | team | broker';
COMMENT ON COLUMN organizations.monthly_analysis_limit IS '-1 = unlimited';
