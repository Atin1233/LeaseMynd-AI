-- Seed pre-built lease templates (organization_id NULL, is_prebuilt true)
-- Run in Supabase SQL Editor after 0015_templates_api_keys_webhooks.sql

INSERT INTO lease_templates (
  id,
  organization_id,
  created_by,
  name,
  description,
  structure_type,
  content_json,
  is_prebuilt,
  shared_with_org,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  NULL,
  NULL,
  name,
  description,
  structure_type,
  NULL,
  true,
  true,
  NOW(),
  NULL
FROM (VALUES
  ('Standard Office Lease', 'Common office lease structure with base rent, CAM, and term.', 'office'),
  ('Retail NNN Lease', 'Triple-net retail lease with common area and tax pass-throughs.', 'retail'),
  ('Industrial Gross Lease', 'Industrial space with landlord paying most operating costs.', 'industrial'),
  ('Full Service Office Lease', 'Office lease with all-in base rent (utilities, janitorial, etc.).', 'office'),
  ('Ground Lease', 'Long-term land lease; tenant builds and maintains improvements.', 'ground'),
  ('Short-Term Flexible Lease', 'Flex space or coworking-style short term with minimal TI.', 'flex'),
  ('Medical Office Lease', 'Healthcare tenant improvements, HIPAA, and use restrictions.', 'medical'),
  ('Restaurant Lease', 'HVAC, grease trap, exhaust, and build-out provisions.', 'retail'),
  ('Warehouse / Distribution', 'Loading docks, clear height, floor load, and logistics clauses.', 'industrial'),
  ('Multifamily Ground Lease', 'Ground lease for apartment development with subordination.', 'ground'),
  ('Bank Branch Lease', 'Security, drive-through, and financial use provisions.', 'retail'),
  ('Lab / R&D Space', 'Hazardous materials, ventilation, and specialized build-out.', 'industrial'),
  ('Data Center Lease', 'Power, cooling, redundancy, and access controls.', 'industrial'),
  ('Parking Agreement', 'Structured or surface parking; allocation and access.', 'parking'),
  ('Sublease / Assignment', 'Template for sublease or assignment of existing lease.', 'sublease'),
  ('Amendment – Rent Abatement', 'Short form amendment for rent abatement or deferral.', 'amendment'),
  ('Amendment – Term Extension', 'Extension of term and optional renewal terms.', 'amendment'),
  ('Amendment – Expansion', 'Addition of adjacent or additional space.', 'amendment'),
  ('Letter of Intent (LOI)', 'Non-binding LOI structure for lease negotiation.', 'loi'),
  ('License Agreement', 'Short-term or limited use license (e.g., kiosk, signage).', 'license'),
  ('Build-to-Suit', 'Landlord builds to tenant specs; lease commences on completion.', 'build_to_suit'),
  ('Sale-Leaseback', 'Property sale with simultaneous long-term leaseback to seller.', 'sale_leaseback'),
  ('Single-Tenant Net Lease', 'Single-tenant net lease (NNN) with minimal landlord obligations.', 'retail'),
  ('Multi-Tenant Retail', 'Inline or mall space with common area and percentage rent.', 'retail'),
  ('Coworking / Managed Office', 'Flexible term, inclusive services, and membership-style terms.', 'flex'),
  ('Government / Public Sector', 'Clauses for government tenant (sovereignty, termination, etc.).', 'office'),
  ('Nonprofit / Institutional', 'Mission-based use and often favorable termination or assignment.', 'office'),
  ('Anchor Tenant – Retail', 'Large anchor with co-tenancy, exclusives, and parking.', 'retail'),
  ('Parking Garage Lease', 'Dedicated garage or stall lease with access and maintenance.', 'parking')
) AS t(name, description, structure_type);

-- Run once. To re-run: DELETE FROM lease_templates WHERE is_prebuilt = true AND organization_id IS NULL; then run this again.
