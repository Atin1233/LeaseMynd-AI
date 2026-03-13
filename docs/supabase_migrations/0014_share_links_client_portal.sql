-- Client sharing portal (Broker plan): share links, white-label, analytics, approvals
-- Run this in Supabase SQL Editor. Requires: organizations, leases, profiles, lease_comments.

-- =============================================================================
-- Share links: secure links with optional password and expiration
-- =============================================================================
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  expires_at TIMESTAMPTZ,
  label TEXT,
  allow_comments BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_lease_id ON share_links(lease_id);
CREATE INDEX IF NOT EXISTS idx_share_links_organization_id ON share_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage share links" ON share_links;
CREATE POLICY "Org members can manage share links"
  ON share_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = share_links.organization_id AND p.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = share_links.organization_id AND p.id = auth.uid()
    )
  );

-- Service role / anon can read by token only via app (API validates token)
-- No policy for anon; API will use service role or a dedicated function to resolve token.

-- =============================================================================
-- Organization branding (white-label): logo, colors, optional custom domain
-- =============================================================================
CREATE TABLE IF NOT EXISTS organization_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  custom_domain TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_organization_branding_org ON organization_branding(organization_id);

ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can manage branding" ON organization_branding;
CREATE POLICY "Org admins can manage branding"
  ON organization_branding FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = organization_branding.organization_id
        AND p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = organization_branding.organization_id
        AND p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- Share link views (analytics): client views/engagement
-- =============================================================================
CREATE TABLE IF NOT EXISTS share_link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX IF NOT EXISTS idx_share_link_views_share_link_id ON share_link_views(share_link_id);
CREATE INDEX IF NOT EXISTS idx_share_link_views_viewed_at ON share_link_views(viewed_at);

ALTER TABLE share_link_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service/backend can insert views" ON share_link_views;
-- Allow org members to read analytics for their share links
DROP POLICY IF EXISTS "Org members can read share link views" ON share_link_views;
CREATE POLICY "Org members can read share link views"
  ON share_link_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM share_links sl
      JOIN profiles p ON p.organization_id = sl.organization_id AND p.id = auth.uid()
      WHERE sl.id = share_link_views.share_link_id
    )
  );

-- Insert is done server-side with service role (no policy for anon/auth insert needed for views).

-- =============================================================================
-- Approval workflows: approve / request changes, optional e-sign
-- =============================================================================
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, changes_requested
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  response_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_share_link ON approval_workflows(share_link_id);

ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage approvals" ON approval_workflows;
CREATE POLICY "Org members can manage approvals"
  ON approval_workflows FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM share_links sl
      JOIN profiles p ON p.organization_id = sl.organization_id AND p.id = auth.uid()
      WHERE sl.id = approval_workflows.share_link_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM share_links sl
      JOIN profiles p ON p.organization_id = sl.organization_id AND p.id = auth.uid()
      WHERE sl.id = approval_workflows.share_link_id
    )
  );

-- =============================================================================
-- Client comments: allow comments from shared link viewers (no auth)
-- Add columns to lease_comments for share_link_id and guest identity
-- =============================================================================
ALTER TABLE lease_comments ADD COLUMN IF NOT EXISTS share_link_id UUID REFERENCES share_links(id) ON DELETE SET NULL;
ALTER TABLE lease_comments ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE lease_comments ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Make user_id nullable when share_link_id is set (client comment)
-- Supabase/Postgres: leave user_id NOT NULL in schema but use a sentinel or separate table.
-- Simpler: keep user_id NOT NULL and use a "client" profile per share link, or allow NULL.
-- We'll allow user_id to be NULL when share_link_id is set (client comment).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lease_comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE lease_comments ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lease_comments_share_link_id ON lease_comments(share_link_id);

-- RLS: allow SELECT on lease_comments for share link viewers (via app using service role or token check).
-- Insert: org members as today; client insert will be done via API with validated share token (service role).

-- Optional: function to get share link by token (for use by API with service role)
-- CREATE OR REPLACE FUNCTION get_share_link_by_token(t TEXT)
-- RETURNS SETOF share_links AS $$ ... $$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON TABLE share_links IS 'Broker plan: secure share links with optional password and expiration';
COMMENT ON TABLE organization_branding IS 'Broker plan: white-label logo, colors, custom domain';
COMMENT ON TABLE share_link_views IS 'Analytics: client views on shared analyses';
COMMENT ON TABLE approval_workflows IS 'Approval workflows for shared analyses';
