-- Fix Security Issues Identified by Supabase Security Advisor
-- This migration addresses:
-- 1. RLS Disabled on market_benchmarks table
-- 2. Function Search Path Mutable (5 functions)
-- 3. RLS Policy Always True on organizations table (2 policies)

-- ============================================================================
-- 1. Enable RLS on market_benchmarks table
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS market_benchmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Users can manage market benchmarks" ON market_benchmarks;

-- Policy: All authenticated users can view market benchmarks (read-only)
-- Market benchmarks are reference data that should be accessible to all users
CREATE POLICY "Users can view market benchmarks"
  ON market_benchmarks FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only service role can insert/update/delete market benchmarks
-- This ensures only admins/system can modify benchmark data
CREATE POLICY "Users can manage market benchmarks"
  ON market_benchmarks FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 2. Fix Function Search Path Mutable
-- ============================================================================

-- Fix: increment_analysis_count
DROP FUNCTION IF EXISTS increment_analysis_count(UUID);
CREATE OR REPLACE FUNCTION increment_analysis_count(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE organizations
  SET analyses_used_this_month = COALESCE(analyses_used_this_month, 0) + 1
  WHERE id = org_id;
END;
$$;

-- Fix: reset_monthly_analysis_counts
DROP FUNCTION IF EXISTS reset_monthly_analysis_counts();
CREATE OR REPLACE FUNCTION reset_monthly_analysis_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE organizations
  SET analyses_used_this_month = 0,
      billing_cycle_start = DATE_TRUNC('month', CURRENT_DATE);
END;
$$;

-- Fix: insert_lease_chunk
DROP FUNCTION IF EXISTS insert_lease_chunk(UUID, INTEGER, INTEGER, TEXT);
CREATE OR REPLACE FUNCTION insert_lease_chunk(
  p_lease_id UUID,
  p_page INTEGER,
  p_chunk_index INTEGER,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  chunk_id UUID;
BEGIN
  INSERT INTO lease_chunks (lease_id, page, chunk_index, content)
  VALUES (p_lease_id, p_page, p_chunk_index, p_content)
  RETURNING id INTO chunk_id;
  RETURN chunk_id;
END;
$$;

-- Fix: update_lease_status_on_analysis
DROP FUNCTION IF EXISTS update_lease_status_on_analysis(UUID);
CREATE OR REPLACE FUNCTION update_lease_status_on_analysis(p_lease_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE leases
  SET status = 'analyzed',
      updated_at = NOW()
  WHERE id = p_lease_id;
END;
$$;

-- Fix: calculate_risk_level
DROP FUNCTION IF EXISTS calculate_risk_level(NUMERIC);
CREATE OR REPLACE FUNCTION calculate_risk_level(score NUMERIC)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  IF score >= 80 THEN
    RETURN 'low';
  ELSIF score >= 60 THEN
    RETURN 'medium';
  ELSIF score >= 40 THEN
    RETURN 'high';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$;

-- ============================================================================
-- 3. Fix RLS Policies on organizations table
-- ============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON organizations;

-- Policy: Users can view organizations they belong to
-- (Assuming this already exists, but ensuring it's correct)
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
    )
  );

-- Policy: Users can update their own organization (only owners/admins)
CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- Policy: Users can insert organizations (for signup flow)
-- Only allow if user doesn't already have an organization
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id IS NOT NULL
    )
  );

-- Policy: Only owners can delete organizations
CREATE POLICY "Users can delete organizations"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );
