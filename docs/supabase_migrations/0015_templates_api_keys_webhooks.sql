-- Template library, API keys (Growth+), and webhooks
-- Run in Supabase SQL Editor after 0014_share_links_client_portal.sql

-- =============================================================================
-- Lease templates: pre-built + custom, team sharing, version history
-- =============================================================================
CREATE TABLE IF NOT EXISTS lease_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  structure_type TEXT,
  content_json JSONB,
  is_prebuilt BOOLEAN NOT NULL DEFAULT false,
  shared_with_org BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lease_templates_org ON lease_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_lease_templates_prebuilt ON lease_templates(is_prebuilt) WHERE is_prebuilt = true;

ALTER TABLE lease_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage org templates" ON lease_templates;
CREATE POLICY "Org members can manage org templates"
  ON lease_templates FOR ALL
  USING (
    (organization_id IS NULL AND is_prebuilt = true)
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = lease_templates.organization_id AND p.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = lease_templates.organization_id AND p.id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS lease_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES lease_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_json JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lease_template_versions_template ON lease_template_versions(template_id);

ALTER TABLE lease_template_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read template versions" ON lease_template_versions;
CREATE POLICY "Org members can read template versions"
  ON lease_template_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lease_templates t
      JOIN profiles p ON p.organization_id = t.organization_id AND p.id = auth.uid()
      WHERE t.id = lease_template_versions.template_id
    )
    OR EXISTS (
      SELECT 1 FROM lease_templates t
      WHERE t.id = lease_template_versions.template_id AND t.organization_id IS NULL AND t.is_prebuilt = true
    )
  );

-- =============================================================================
-- API keys (Growth+ plans)
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can manage API keys" ON api_keys;
CREATE POLICY "Org admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = api_keys.organization_id AND p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = api_keys.organization_id AND p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- Webhooks (Growth+): analysis completed, etc.
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT ARRAY['analysis.completed'],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_webhooks_org ON webhooks(organization_id);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can manage webhooks" ON webhooks;
CREATE POLICY "Org admins can manage webhooks"
  ON webhooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = webhooks.organization_id AND p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.organization_id = webhooks.organization_id AND p.id = auth.uid() AND p.role IN ('owner', 'admin')
    )
  );

COMMENT ON TABLE lease_templates IS 'Template library: pre-built and custom lease structures';
COMMENT ON TABLE lease_template_versions IS 'Version history for templates';
COMMENT ON TABLE api_keys IS 'API keys for Growth+ plans';
COMMENT ON TABLE webhooks IS 'Webhooks for analysis completed and other events';
