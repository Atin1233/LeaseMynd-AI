# Fix Security Issues

This migration addresses all security warnings identified by Supabase Security Advisor.

## Issues Fixed

### 1. ✅ RLS Disabled on `market_benchmarks` table
- **Error**: Row Level Security was not enabled
- **Fix**: Enabled RLS and created policies:
  - All authenticated users can **view** market benchmarks (read-only)
  - Only service role can **modify** market benchmarks (insert/update/delete)

### 2. ✅ Function Search Path Mutable (5 functions)
- **Warning**: Functions don't explicitly set `search_path`, making them vulnerable to search path hijacking
- **Fixed Functions**:
  - `increment_analysis_count(UUID)`
  - `reset_monthly_analysis_counts()`
  - `insert_lease_chunk(UUID, INTEGER, INTEGER, TEXT)`
  - `update_lease_status_on_analysis(UUID)`
  - `calculate_risk_level(NUMERIC)`
- **Fix**: Added `SET search_path = public, pg_temp` to all functions

### 3. ✅ RLS Policy Always True on `organizations` table
- **Warning**: Policies were using `USING (true)` or `WITH CHECK (true)`, allowing unrestricted access
- **Fix**: Replaced with proper policies:
  - **SELECT**: Users can only view organizations they belong to
  - **UPDATE**: Only owners/admins can update their organization
  - **INSERT**: Users can create organizations only if they don't already have one (for signup)
  - **DELETE**: Only owners can delete organizations

## How to Run

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy & Paste**
   - Copy the entire contents of `drizzle/0008_fix_security_issues.sql`
   - Paste into the SQL Editor

4. **Run Migration**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify**
   - Go to Security Advisor in Supabase Dashboard
   - Refresh the page
   - All errors and warnings should be resolved

## Notes

- **Leaked Password Protection**: This is a Supabase Auth setting, not a database migration. To enable:
  1. Go to Authentication > Settings
  2. Enable "Leaked Password Protection"
  3. This checks passwords against known breach databases

- **Function Security**: All functions now use `SECURITY DEFINER` with explicit `search_path` to prevent search path hijacking attacks.

- **RLS Policies**: All policies now use proper checks based on user roles and organization membership rather than always-true conditions.
