-- Fix Remaining Security Issues
-- This migration addresses:
-- 1. Function Search Path Mutable (3 functions that may not have been updated)
-- 2. RLS Policy Always True (2 old policies on organizations that need to be removed)
-- 3. Multiple Permissive Policies on market_benchmarks (split FOR ALL into separate policies)

-- ============================================================================
-- 1. Fix Function Search Path Mutable
-- ============================================================================

-- Fix: insert_lease_chunk
-- Drop all possible function signatures first
DROP FUNCTION IF EXISTS insert_lease_chunk(UUID, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS insert_lease_chunk(UUID, INTEGER, INTEGER, VARCHAR);
DROP FUNCTION IF EXISTS public.insert_lease_chunk(UUID, INTEGER, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.insert_lease_chunk(UUID, INTEGER, INTEGER, VARCHAR);

-- Recreate with proper search_path
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
-- Drop all possible function signatures
DROP FUNCTION IF EXISTS update_lease_status_on_analysis(UUID);
DROP FUNCTION IF EXISTS public.update_lease_status_on_analysis(UUID);

-- Recreate with proper search_path
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
-- Drop all possible function signatures
DROP FUNCTION IF EXISTS calculate_risk_level(NUMERIC);
DROP FUNCTION IF EXISTS calculate_risk_level(REAL);
DROP FUNCTION IF EXISTS calculate_risk_level(DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.calculate_risk_level(NUMERIC);
DROP FUNCTION IF EXISTS public.calculate_risk_level(REAL);
DROP FUNCTION IF EXISTS public.calculate_risk_level(DOUBLE PRECISION);

-- Recreate with proper search_path
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
-- 2. Remove Overly Permissive RLS Policies on organizations
-- ============================================================================

-- Drop the old "Authenticated users can..." policies that are too permissive
-- These policies use WITH CHECK (true) or USING (true), which bypasses RLS
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can delete organizations" ON organizations;

-- Also drop any other variations that might exist
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON organizations;

-- Recreate proper restrictive policies
-- These policies check organization membership and roles

-- SELECT: Users can only view organizations they belong to
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = (select auth.uid())
    )
  );

-- INSERT: Users can create organizations only if they don't already have one
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id IS NOT NULL
    )
  );

-- UPDATE: Only owners/admins can update their organization
CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = (select auth.uid())
      AND profiles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = (select auth.uid())
      AND profiles.role IN ('owner', 'admin')
    )
  );

-- DELETE: Only owners can delete organizations
CREATE POLICY "Users can delete organizations"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = (select auth.uid())
      AND profiles.role = 'owner'
    )
  );

-- ============================================================================
-- 3. Fix Multiple Permissive Policies on market_benchmarks
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Users can manage market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can manage market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can insert market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can update market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can delete market benchmarks" ON market_benchmarks;

-- Single policy for SELECT (authenticated users only)
-- This is the only SELECT policy, avoiding duplicates
CREATE POLICY "Users can view market benchmarks"
  ON market_benchmarks FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Separate policies for modifications (service role only)
-- Split into INSERT, UPDATE, DELETE to avoid overlap with SELECT
CREATE POLICY "Service role can insert market benchmarks"
  ON market_benchmarks FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can update market benchmarks"
  ON market_benchmarks FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can delete market benchmarks"
  ON market_benchmarks FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- 3. Fix Multiple Permissive Policies on market_benchmarks
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Users can manage market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can manage market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can insert market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can update market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can delete market benchmarks" ON market_benchmarks;

-- Single policy for SELECT (authenticated users only)
-- This is the only SELECT policy, avoiding duplicates
CREATE POLICY "Users can view market benchmarks"
  ON market_benchmarks FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Separate policies for modifications (service role only)
-- Split into INSERT, UPDATE, DELETE to avoid overlap with SELECT
CREATE POLICY "Service role can insert market benchmarks"
  ON market_benchmarks FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can update market benchmarks"
  ON market_benchmarks FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

CREATE POLICY "Service role can delete market benchmarks"
  ON market_benchmarks FOR DELETE
  USING ((select auth.role()) = 'service_role');
