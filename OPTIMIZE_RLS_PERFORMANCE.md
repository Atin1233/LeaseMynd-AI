# Optimize RLS Performance

This migration fixes all performance warnings related to RLS (Row Level Security) policies.

## Issues Fixed

### 1. ✅ Auth RLS Initialization Plan (26 policies)
- **Problem**: Policies were re-evaluating `auth.uid()` and `auth.role()` for each row, causing poor performance at scale
- **Fix**: Wrapped all `auth.uid()` and `auth.role()` calls in `(select auth.uid())` and `(select auth.role())` to evaluate once per query
- **Impact**: Significantly improves query performance, especially for large tables

### 2. ✅ Multiple Permissive Policies (6 duplicate policies)
- **Problem**: Some tables had multiple permissive policies for the same role/action, causing all policies to be evaluated
- **Fixed Tables**:
  - `market_benchmarks`: Consolidated 2 SELECT policies into 1
  - `organizations`: Consolidated duplicate SELECT, INSERT, and UPDATE policies
- **Impact**: Reduces policy evaluation overhead

## Tables Optimized

All RLS policies have been optimized for the following tables:
- ✅ `profiles` (3 policies)
- ✅ `organizations` (4 policies - consolidated)
- ✅ `leases` (4 policies)
- ✅ `lease_chunks` (2 policies)
- ✅ `lease_analyses` (2 policies)
- ✅ `clause_extractions` (2 policies)
- ✅ `lease_comments` (4 policies)
- ✅ `market_benchmarks` (2 policies - consolidated)
- ✅ `team_invites` (3 policies)

## How to Run

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy & Paste**
   - Copy the entire contents of `drizzle/0009_optimize_rls_performance.sql`
   - Paste into the SQL Editor

4. **Run Migration**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify**
   - Go to Database Linter / Security Advisor
   - Refresh the page
   - All performance warnings should be resolved

## Performance Impact

**Before**: Each RLS policy evaluated `auth.uid()` or `auth.role()` for every row in the query result.

**After**: `auth.uid()` and `auth.role()` are evaluated once per query, then reused for all rows.

**Expected Improvement**: 
- 10-100x faster for queries returning many rows
- Reduced database CPU usage
- Better scalability as your data grows

## Technical Details

The optimization works by wrapping auth function calls in a subquery:
- ❌ `auth.uid()` → Evaluated per row
- ✅ `(select auth.uid())` → Evaluated once per query

This leverages PostgreSQL's query planner to cache the result and reuse it across all row evaluations.
