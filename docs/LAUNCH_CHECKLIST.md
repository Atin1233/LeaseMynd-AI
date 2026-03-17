# LeaseMynd Production Launch Checklist

**Last Updated:** February 2025  
**Purpose:** Pre-launch verification for production deployment

---

## 1. Environment Variables

### Required (must be set for full app)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role (server-side only)
- [ ] `GOOGLE_AI_API_KEY` – Google AI Studio API key for lease analysis

### Optional (recommended for production)

- [ ] `NEXT_PUBLIC_APP_URL` – Production app URL (e.g. `https://leasemynd.com`)
- [ ] `SENTRY_DSN` – Error tracking (Sentry)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` – Product analytics (PostHog)
- [ ] `UPSTASH_REDIS_REST_URL` – Caching (Upstash Redis)
- [ ] `UPSTASH_REDIS_REST_TOKEN` – Caching token
- [ ] `DATALAB_API_KEY` – OCR for scanned documents (if needed)
- [ ] `DATABASE_URL` – PostgreSQL for Drizzle migrations (optional if using Supabase DB only; build skips migrations if unset or unreachable)

### Stripe (when billing is enabled – ignored for pilot)

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_SINGLE_PRICE_ID`
- [ ] `STRIPE_TEAM_PRICE_ID`
- [ ] `STRIPE_BROKER_PRICE_ID`

---

## 2. Security Review

- [ ] No secrets in client-side code or public env vars
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only used server-side
- [ ] RLS policies enabled and tested on Supabase
- [x] Rate limiting enabled on sensitive API routes (`/api/analyze-lease`, `/api/upload-lease`)
- [x] File upload validation (type, size limits) on upload-lease and uploadDocument
- [x] Auth middleware protects dashboard routes (`/dashboard`, `/upload`, `/lease`)

---

## 3. Database & Migrations

- [ ] All migrations applied when DB available (`pnpm db:migrate:manual` with `DATABASE_URL` set)
- [ ] pgvector extension enabled (Supabase has it by default)
- [ ] Backup strategy configured (Supabase auto-backups or manual)
- [ ] Connection pooling considered for scale (PgBouncer if self-hosted)

**Note:** Build completes without a reachable DB; migrations run in prebuild only when `DATABASE_URL` is set and connection succeeds within 5s. Otherwise migrations are skipped and build continues.

---

## 4. Monitoring & Observability

- [ ] Sentry configured for error tracking (set `SENTRY_DSN`)
- [ ] PostHog or analytics configured (set `NEXT_PUBLIC_POSTHOG_KEY`)
- [ ] Logging level set appropriately (`info` in production)
- [ ] Health/uptime monitoring (e.g. Vercel Analytics, UptimeRobot)

---

## 5. Performance

- [ ] Redis caching enabled for analysis results (Upstash in production)
- [x] Static assets served via CDN (Vercel handles this)
- [ ] Image optimization configured (Next.js `remotePatterns` in config)

---

## 6. Pre-Launch Verification

- [x] `pnpm build` completes successfully (migrations skip if DB unreachable)
- [x] `pnpm test` – all tests pass
- [x] `pnpm check` – ESLint and TypeScript pass
- [ ] Login flow works (Supabase Auth) – verify in target env
- [ ] Lease upload and analysis end-to-end works – verify in target env
- [ ] Export PDF works – verify in target env
- [ ] Help/documentation accessible – verify in target env

---

## 7. Post-Launch

- [ ] Monitor error rates in Sentry
- [ ] Check analytics for user flows
- [ ] Verify rate limits are not blocking legitimate users
- [ ] Database connection health
- [ ] API latency (AI analysis, upload)

---

## Quick Commands

```bash
# Verify build (no DB required; migrations skip if unreachable)
pnpm build

# Run tests
pnpm test

# Type check
pnpm exec tsc --noEmit

# Lint
pnpm run check

# Run migrations when DB is available
pnpm db:migrate:manual
```
