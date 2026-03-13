-- Create lease_comments table for team collaboration
CREATE TABLE IF NOT EXISTS lease_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID NOT NULL,
  clause_id UUID,
  analysis_id UUID,
  parent_comment_id UUID,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Drop existing constraints if they exist (for idempotency)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lease_comments_lease_id_fkey') THEN
    ALTER TABLE lease_comments DROP CONSTRAINT lease_comments_lease_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lease_comments_clause_id_fkey') THEN
    ALTER TABLE lease_comments DROP CONSTRAINT lease_comments_clause_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lease_comments_analysis_id_fkey') THEN
    ALTER TABLE lease_comments DROP CONSTRAINT lease_comments_analysis_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lease_comments_parent_comment_id_fkey') THEN
    ALTER TABLE lease_comments DROP CONSTRAINT lease_comments_parent_comment_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lease_comments_user_id_fkey') THEN
    ALTER TABLE lease_comments DROP CONSTRAINT lease_comments_user_id_fkey;
  END IF;
END $$;

-- Add foreign key constraints
ALTER TABLE lease_comments 
  ADD CONSTRAINT lease_comments_lease_id_fkey 
  FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE;

ALTER TABLE lease_comments 
  ADD CONSTRAINT lease_comments_clause_id_fkey 
  FOREIGN KEY (clause_id) REFERENCES clause_extractions(id) ON DELETE CASCADE;

ALTER TABLE lease_comments 
  ADD CONSTRAINT lease_comments_analysis_id_fkey 
  FOREIGN KEY (analysis_id) REFERENCES lease_analyses(id) ON DELETE CASCADE;

ALTER TABLE lease_comments 
  ADD CONSTRAINT lease_comments_parent_comment_id_fkey 
  FOREIGN KEY (parent_comment_id) REFERENCES lease_comments(id) ON DELETE CASCADE;

ALTER TABLE lease_comments 
  ADD CONSTRAINT lease_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lease_comments_lease_id ON lease_comments(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_comments_clause_id ON lease_comments(clause_id);
CREATE INDEX IF NOT EXISTS idx_lease_comments_analysis_id ON lease_comments(analysis_id);
CREATE INDEX IF NOT EXISTS idx_lease_comments_parent_comment_id ON lease_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_lease_comments_user_id ON lease_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_lease_comments_created_at ON lease_comments(created_at DESC);

-- Enable RLS
ALTER TABLE lease_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view comments in their organization" ON lease_comments;
DROP POLICY IF EXISTS "Users can create comments in their organization" ON lease_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON lease_comments;
DROP POLICY IF EXISTS "Users can delete comments" ON lease_comments;

-- RLS Policies
-- Users can view comments on leases in their organization
CREATE POLICY "Users can view comments in their organization"
  ON lease_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_comments.lease_id
      AND p.id = auth.uid()
    )
  );

-- Users can create comments on leases in their organization
CREATE POLICY "Users can create comments in their organization"
  ON lease_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_comments.lease_id
      AND p.id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON lease_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments, admins/owners can delete any comment in their org
CREATE POLICY "Users can delete comments"
  ON lease_comments FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM leases l
      JOIN profiles p ON p.organization_id = l.organization_id
      WHERE l.id = lease_comments.lease_id
      AND p.id = auth.uid()
      AND p.role IN ('owner', 'admin')
    )
  );
