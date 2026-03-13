-- Optimize RLS Policies for Performance
-- This migration fixes:
-- 1. Auth RLS Initialization Plan warnings (wrap auth.uid() and auth.role() in SELECT)
-- 2. Multiple Permissive Policies warnings (consolidate duplicate policies)

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- Optimized policies with (select auth.uid()) for performance
CREATE POLICY "Allow users to insert own profile"
  ON profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Allow users to read own profile"
  ON profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Allow users to update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

-- Drop all existing policies (including duplicates)
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organizations" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can update organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete organizations" ON organizations;

-- Consolidated and optimized policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = (select auth.uid())
    )
  );

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

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.organization_id IS NOT NULL
    )
  );

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
-- LEASES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view leases in their organization" ON leases;
DROP POLICY IF EXISTS "Users can insert leases in their organization" ON leases;
DROP POLICY IF EXISTS "Users can update leases in their organization" ON leases;
DROP POLICY IF EXISTS "Users can delete leases in their organization" ON leases;

-- Optimized policies
CREATE POLICY "Users can view leases in their organization"
  ON leases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = leases.organization_id
      AND profiles.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert leases in their organization"
  ON leases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = leases.organization_id
      AND profiles.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update leases in their organization"
  ON leases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = leases.organization_id
      AND profiles.id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = leases.organization_id
      AND profiles.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete leases in their organization"
  ON leases FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = leases.organization_id
      AND profiles.id = (select auth.uid())
    )
  );

-- ============================================================================
-- LEASE_CHUNKS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view chunks for their leases" ON lease_chunks;
DROP POLICY IF EXISTS "Users can insert chunks for their leases" ON lease_chunks;

-- Optimized policies
CREATE POLICY "Users can view chunks for their leases"
  ON lease_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_chunks.lease_id
      AND p.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert chunks for their leases"
  ON lease_chunks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_chunks.lease_id
      AND p.id = (select auth.uid())
    )
  );

-- ============================================================================
-- LEASE_ANALYSES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view analyses for their leases" ON lease_analyses;
DROP POLICY IF EXISTS "Users can insert analyses for their leases" ON lease_analyses;

-- Optimized policies
CREATE POLICY "Users can view analyses for their leases"
  ON lease_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_analyses.lease_id
      AND p.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert analyses for their leases"
  ON lease_analyses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_analyses.lease_id
      AND p.id = (select auth.uid())
    )
  );

-- ============================================================================
-- CLAUSE_EXTRACTIONS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view clauses for their leases" ON clause_extractions;
DROP POLICY IF EXISTS "Users can insert clauses for their leases" ON clause_extractions;

-- Optimized policies
CREATE POLICY "Users can view clauses for their leases"
  ON clause_extractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = clause_extractions.lease_id
      AND p.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert clauses for their leases"
  ON clause_extractions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = clause_extractions.lease_id
      AND p.id = (select auth.uid())
    )
  );

-- ============================================================================
-- LEASE_COMMENTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view comments in their organization" ON lease_comments;
DROP POLICY IF EXISTS "Users can create comments in their organization" ON lease_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON lease_comments;
DROP POLICY IF EXISTS "Users can delete comments" ON lease_comments;

-- Optimized policies
CREATE POLICY "Users can view comments in their organization"
  ON lease_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_comments.lease_id
      AND p.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create comments in their organization"
  ON lease_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_comments.lease_id
      AND p.id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments"
  ON lease_comments FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete comments"
  ON lease_comments FOR DELETE
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_comments.lease_id
      AND p.id = (select auth.uid())
      AND p.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- MARKET_BENCHMARKS TABLE
-- ============================================================================

-- Drop all existing policies (consolidate duplicates)
DROP POLICY IF EXISTS "Users can view market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Users can manage market benchmarks" ON market_benchmarks;
DROP POLICY IF EXISTS "Service role can manage market benchmarks" ON market_benchmarks;

-- Single policy for SELECT (authenticated users only)
CREATE POLICY "Users can view market benchmarks"
  ON market_benchmarks FOR SELECT
  USING ((select auth.role()) = 'authenticated');

-- Policy for INSERT (service role only) - separate from SELECT to avoid duplicates
CREATE POLICY "Service role can insert market benchmarks"
  ON market_benchmarks FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role');

-- Policy for UPDATE (service role only)
CREATE POLICY "Service role can update market benchmarks"
  ON market_benchmarks FOR UPDATE
  USING ((select auth.role()) = 'service_role')
  WITH CHECK ((select auth.role()) = 'service_role');

-- Policy for DELETE (service role only)
CREATE POLICY "Service role can delete market benchmarks"
  ON market_benchmarks FOR DELETE
  USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- TEAM_INVITES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invites for their organization" ON team_invites;
DROP POLICY IF EXISTS "Admins and owners can create invites" ON team_invites;
DROP POLICY IF EXISTS "Admins and owners can delete invites" ON team_invites;

-- Optimized policies
CREATE POLICY "Users can view invites for their organization"
  ON team_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = team_invites.organization_id
      AND profiles.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins and owners can create invites"
  ON team_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = team_invites.organization_id
      AND profiles.id = (select auth.uid())
      AND profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins and owners can delete invites"
  ON team_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.organization_id = team_invites.organization_id
      AND profiles.id = (select auth.uid())
      AND profiles.role IN ('owner', 'admin')
    )
  );
