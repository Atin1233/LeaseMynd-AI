# Codebase Simplification - Quick Checklist

## Critical Issues Found

### 🔴 High Priority - Breaking Architecture Issues

1. **Dual Authentication Systems**
   - ❌ Clerk (employee/employer pages)
   - ❌ Supabase Auth (lease management)
   - ✅ **Action**: Choose one (recommend Supabase Auth)

2. **Dual Database Systems**
   - ❌ Drizzle ORM (documents, study-agent)
   - ❌ Supabase (leases, organizations)
   - ✅ **Action**: Migrate to Supabase (recommended)

3. **Duplicate Upload Logic**
   - ✅ **Done**: Shared `~/lib/pdf/processor` used by `upload-lease` and `uploadDocument`

### 🟡 Medium Priority - Code Quality

4. **Multiple AI Providers (Inconsistent)**
   - ~~OpenAI, Groq, Anthropic~~ → **Done**: Google AI Studio only
   - ✅ **Done**: `~/lib/ai` abstraction, lease analysis uses `callGoogleAI`, all chat uses `createChatModel` (Gemini)

5. **Inconsistent Error Handling**
   - ❌ Some use `api-utils.ts`
   - ❌ Some use `NextResponse.json()` directly
   - ✅ **Action**: Standardize on `api-utils` with Supabase support

6. **Unused Code**
   - ✅ **Done**: Renamed UNUSED_* study-agent tools (they were in use)

### 🟢 Low Priority - Cleanup

7. **Overlapping Features**
   - ⚠️ Study Agent vs AI Assistant (similar RAG)
   - ⚠️ Predictive Analysis vs Lease Analysis
   - ✅ **Action**: Review and document boundaries

---

## Tests

Run with Google AI env (no Groq/OpenAI required for AI code paths):

```bash
SKIP_ENV_VALIDATION=1 GOOGLE_AI_API_KEY=test-key pnpm test
```

## Quick Wins (Do First)

1. ~~**Delete unused files**~~ → Renamed UNUSED_* tools (they were in use).

2. **Create AI abstraction** ✅ **Done**
   - `src/lib/ai` – Google AI Studio only; `createChatModel()` for all chat.

3. **Extract PDF processing** ✅ **Done**
   - `src/lib/pdf/processor.ts` – `loadPdfFromPath`, `splitPdfIntoChunks`, `sanitizeChunkContent`.
   - Used by `upload-lease` and `uploadDocument`.

---

## Major Refactoring (Plan Carefully)

### Phase 1: Auth Consolidation
- [ ] Audit Clerk usage (1 hour)
- [ ] Create unified auth utilities (2 hours)
- [ ] Migrate employee pages (4 hours)
- [ ] Migrate employer pages (4 hours)
- [ ] Remove Clerk dependencies (1 hour)
- [ ] Test authentication flows (2 hours)

**Total: ~14 hours (2 days)**

### Phase 2: Database Unification
- [ ] Audit database usage (2 hours)
- [ ] Create unified DB utilities (3 hours)
- [ ] Create Supabase migrations (4 hours)
- [ ] Migrate Drizzle queries (8 hours)
- [ ] Remove Drizzle dependencies (1 hour)
- [ ] Test database operations (3 hours)

**Total: ~21 hours (3 days)**

### Phase 3: Error Handling
- [ ] Enhance api-utils (2 hours)
- [ ] Create API handler wrapper (2 hours)
- [ ] Migrate all API routes (6 hours)
- [ ] Test error scenarios (2 hours)

**Total: ~12 hours (1.5 days)**

---

## Files to Delete (after Phase 1 / Phase 2)

```
src/app/api/employeeAuth/route.ts
src/app/api/employerAuth/route.ts
src/server/db/schema/* (after DB migration)
```
(UNUSED_* tools were renamed; they are in use.)

## Files to Create

```
src/lib/auth/index.ts
src/lib/db/index.ts
src/lib/ai/index.ts
src/lib/pdf/processor.ts
src/lib/api/handler.ts
```

## Files to Refactor (Major Changes)

```
src/app/api/upload-lease/route.ts
src/app/api/uploadDocument/route.ts
src/app/api/AIAssistant/route.ts
src/app/api/study-agent/**/*.ts
src/app/api/predictive-document-analysis/**/*.ts
src/lib/groq/lease-analyzer.ts
All employee/employer pages
```

---

## Estimated Timeline

- **Quick Wins**: 1 day
- **Phase 1 (Auth)**: 2 days
- **Phase 2 (Database)**: 3 days
- **Phase 3 (Error Handling)**: 1.5 days
- **Testing & Polish**: 2 days

**Total: ~9.5 days (2 weeks)**

---

## Risk Assessment

| Phase | Risk Level | Mitigation |
|-------|-----------|------------|
| Auth Consolidation | 🔴 High | Support both systems temporarily |
| Database Migration | 🔴 High | Backup, test migrations thoroughly |
| AI Abstraction | 🟡 Medium | Feature flag new implementation |
| Error Handling | 🟢 Low | Gradual migration, test each route |

---

## Success Criteria

- ✅ Single authentication system
- ✅ Single database system
- ✅ Unified AI abstraction
- ✅ No duplicate code
- ✅ All tests passing
- ✅ No performance regressions

---

## Next Steps

1. Review `SIMPLIFICATION_PLAN.md` for detailed strategy
2. Decide on authentication system (recommend Supabase)
3. Decide on database system (recommend Supabase)
4. Start with quick wins
5. Plan major refactoring in phases
