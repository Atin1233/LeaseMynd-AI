# Phase 1: Auth consolidation – migration plan

**Goal:** Single auth system (Supabase Auth). Remove Clerk. Simplify the codebase and avoid conflicting auth paths.

**Constraints (non‑negotiable):**
- **No loss of functionality or features** – every existing flow must continue to work.
- **No change to visuals** – same UI, same layout, same styling. We only change how we resolve “current user.”
- **PRD alignment** – LeaseAI PRD specifies “Supabase Auth (email, Google, SSO)” and role‑based access.

---

## Current state

| Area | Auth | Data |
|------|------|------|
| **Dashboard / lease** | Supabase Auth | `profiles`, `organizations`, Supabase RLS |
| **Employer / employee** | Clerk | Drizzle `users`, `company`; `userId` = Clerk ID |
| **Study agent** | Clerk `userId` | Drizzle study‑agent tables (`user_id` = Clerk ID) |
| **Marketing (about, contact, etc.)** | ClerkProvider for Navbar | — |

---

## Target state

- **All areas** use Supabase Auth only.
- **Dashboard / lease:** Unchanged (already Supabase). Use `~/lib/auth` (`requireAuth`, `getCurrentUser`).
- **Employer / employee:** Use Supabase session; resolve user via `users.supabase_user_id` (new column). Same `users` + `company` model, same employer/employee flows and UIs.
- **Study agent:** Use Supabase user id in study‑agent tables; same features and UI.
- **Marketing:** No Clerk. Navbar “Get started” → `/signup` (Supabase). ClerkProvider removed.

---

## Implementation order

### 1. Auth utilities ✅

- **Done:** `~/lib/auth/index.ts` with `getCurrentUser()`, `requireAuth()`.
- **Done:** Dashboard layout uses `requireAuth()` and same Supabase client for profile/org (no behavior or UI change).

### 2. Schema changes (Drizzle + study‑agent) ✅

- **Done:** Added `supabase_user_id` (UUID, nullable, unique) to `users` in Drizzle schema.
- **Done:** Migration `drizzle/0013_add_supabase_user_id_to_users.sql` adds the column and index.
- `users.userId` remains Clerk ID during transition; new column for Supabase ID.
- Study‑agent tables: keep `user_id` as main FK; we will store Supabase user id there. Optionally add a migration to introduce `supabase_user_id` where we currently use Clerk `userId` (or repurpose `user_id` once Clerk is gone).
- **No drop or rename of columns** until Clerk is fully removed; we only add and backfill.

**Run the migration:**

1. **Supabase Dashboard:** SQL Editor → paste contents of `drizzle/0013_add_supabase_user_id_to_users.sql` → Run.
2. **psql:** `psql "$DATABASE_URL" -f drizzle/0013_add_supabase_user_id_to_users.sql`
3. Ensure `DATABASE_URL` points at the same Postgres used by Drizzle (often your Supabase project).

### 3. Employer / employee auth APIs ✅

- **employerAuth / employeeAuth:**  
  - Done: `~/lib/auth/employer-employee.ts` with `getEmployerEmployeeUser()`.  
  - Prefers Supabase: `getCurrentUser()` → lookup `users` by `supabase_user_id`.  
  - Fallback: Clerk `userId` → lookup by `users.userId`.  
  - Same response shape and status codes; no API contract change.
- **Signup APIs** (`/api/signup/employer`, `employee`, `employerCompany`):  
  - Done: Accept `supabase_user_id` or `supabaseUserId` (optional) in addition to `userId`.  
  - Create/update `users` with `supabaseUserId` when provided.  
  - Require at least one of `userId` or `supabase_user_id`.  
  - Eventually require `supabase_user_id` only and drop Clerk.

### 4. Employer / employee signup UI ✅

- **Done:** Dedicated `/employer/signup` and `/employee/signup`. Employer flow: Create company | Join existing → Supabase signUp → API with `supabase_user_id`. Employee: same. Links between signup flows and login.
- **Option A (not used):** Use existing `/signup` (Supabase) and add a post‑signup step: “Create company” vs “Join as employer” vs “Join as employee,” then call existing signup APIs with `supabase_user_id`.  
- **Option B:** Dedicated `/employer/signup`, `/employee/signup` that use Supabase `signUp` then call the same APIs.  
- **Preserve:** Same forms, same fields, same validation, same success/error behavior and visuals.

### 5. Employer / employee pages and UI ✅

- **Done:** EmployerAuthProvider and EmployeeAuthProvider use `employerAuth` / `employeeAuth` APIs (which use `getEmployerEmployeeUser` — Supabase first, Clerk fallback).
- **Done:** Custom ProfileDropdown shows name, email, sign out (POST to `/auth/signout`). `/auth/signout` signs out both Supabase and Clerk.
- **Done:** All employer and employee pages use `useEmployerAuth` / `useEmployeeAuth` instead of Clerk `useAuth` / `useUser`.
- **Done:** `fetchUserInfo`, `fetchDocument`, Categories APIs, `fetchCompany`, `updateCompany` use `getEmployerEmployeeUser`.

### 6. Study agent ✅

- **Done:** All study-agent API routes use `getEmployerEmployeeUser()` (Supabase-first, Clerk fallback). Study-agent is under `/employer/studyAgent` so employer auth applies.
- **Frontend:** No Clerk usage in study-agent; it's under EmployerAuthProvider. Same study-agent features and UI.

### 7. Marketing and shared UI ✅

- **Done:** Navbar "Get Started" and Pricing "Try Demo Now" are now plain Links to `/signup`. No SignUpButton. Removed ClerkProvider from About, Contact, Pricing, Deployment.
- **Navbar (legacy ref):** “Get started” → Link to `/signup` (or employer signup). Remove `SignUpButton` and ClerkProvider from marketing pages.  
- **About, contact, pricing, deployment:** Remove ClerkProvider; use same layout and styling. Auth not required for these pages.

### 8. Remove Clerk ✅

- **Done:** Removed `@clerk/nextjs` and `@clerk/themes` from package.json.
- Remove Clerk env vars from docs/env example.
- **Schema cleanup:** Drop Clerk-specific columns or migrate `userId` → `supabase_user_id` and drop `userId`; update FKs. Run only after all flows use Supabase.

---

## Rollback and safety

- **Feature flags:** Optional. Prefer “ Supabase‑first, Clerk fallback” in employer/employee during transition; then remove fallback.  
- **No destructive schema changes** until Clerk is fully removed and we’ve verified all flows.  
- **Testing:** After each step, verify login, signup, employer/employee flows, study agent, and dashboard/lease flows. No regressions in functionality or UI.

---

## Files to touch (summary)

| Step | Files |
|------|--------|
| Auth utilities | `~/lib/auth/index.ts` (new), dashboard layout |
| Schema | Drizzle migration(s) for `users`, study‑agent |
| Auth APIs | `~/lib/auth/employer-employee.ts` (new), `employerAuth`, `employeeAuth`, signup APIs |
| Signup UI | `/signup` and/or employer/employee signup pages |
| Employer/employee UI | Pages using `useAuth` / `useUser`; `ProfileDropdown`; `EmployerAuthCheck`; etc. |
| Study agent | Study‑agent API routes and any frontend auth |
| Marketing | Navbar, about, contact, pricing, deployment |
| Cleanup | Remove Clerk deps and Clerk-only code |

---

## Success criteria

- [ ] Single auth system (Supabase Auth only).
- [ ] All current functionality preserved (dashboard, lease, employer, employee, study agent, marketing).
- [ ] No visual or UX regressions.
- [ ] No Clerk usage remaining.
- [ ] Build and tests pass.
