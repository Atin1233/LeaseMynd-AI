# Codebase Simplification Plan
## LeaseMynd - Comprehensive Refactoring Strategy

**Date:** January 26, 2026  
**Goal:** Eliminate unnecessary complexity, remove duplicate code, consolidate overlapping functionality, and ensure all features work properly with a clean, maintainable architecture.

---

## Executive Summary

The codebase currently suffers from:
- **Dual authentication systems** (Clerk + Supabase Auth)
- **Dual database systems** (Drizzle ORM + Supabase)
- **Multiple AI providers** used inconsistently (OpenAI, Groq, Google AI, Anthropic)
- **Duplicate upload/processing logic** across multiple endpoints
- **Unused/dead code** marked as UNUSED_
- **Inconsistent error handling** patterns
- **Overlapping features** (Study Agent, AI Assistant, Predictive Analysis)

**Target Outcome:** Single auth system, unified database layer, consolidated AI abstraction, shared utilities, and clear feature boundaries.

---

## Phase 1: Authentication & Authorization Consolidation

### Current State
- **Clerk**: Used for employee/employer pages (`/employee/*`, `/employer/*`)
  - Files: `src/app/api/employeeAuth/route.ts`, `src/app/api/employerAuth/route.ts`
  - Drizzle schema: `users` table with `userId` (Clerk ID)
- **Supabase Auth**: Used for lease management (`/dashboard/*`, `/api/leases/*`)
  - Files: `src/lib/supabase/*`, `src/middleware.ts`
  - Supabase schema: `profiles` table with `id` (Supabase UUID)

### Decision Required
**Option A: Migrate to Supabase Auth (Recommended)**
- Pros: Already used for core lease features, better integration with Supabase storage/RLS
- Cons: Need to migrate Clerk users, update all employee/employer pages
- Effort: High (2-3 days)

**Option B: Migrate to Clerk**
- Pros: More features (social auth, MFA), better UX
- Cons: Need to migrate lease features, less integration with Supabase
- Effort: High (2-3 days)

**Recommendation: Option A (Supabase Auth)** - Already integrated with core features

### Actions
1. **Audit all Clerk usage**
   - [ ] List all files using `@clerk/nextjs`
   - [ ] Identify user data dependencies
   - [ ] Map Clerk user IDs to Supabase profiles

2. **Create unified auth utilities**
   - [ ] Create `src/lib/auth/index.ts` with:
     - `getCurrentUser()` - unified user fetching
     - `requireAuth()` - middleware helper
     - `requireRole(role)` - role-based access
   - [ ] Replace all `auth()` from Clerk and `supabase.auth.getUser()` calls

3. **Migrate employee/employer pages**
   - [ ] Update `/employee/*` pages to use Supabase Auth
   - [ ] Update `/employer/*` pages to use Supabase Auth
   - [ ] Remove `src/app/api/employeeAuth/route.ts`
   - [ ] Remove `src/app/api/employerAuth/route.ts`
   - [ ] Update Drizzle schema to use Supabase user IDs

4. **Update middleware**
   - [ ] Consolidate auth checks in `src/middleware.ts`
   - [ ] Remove Clerk-specific middleware

5. **Data migration script**
   - [ ] Create script to migrate Clerk users to Supabase
   - [ ] Map existing user data
   - [ ] Test migration on staging

**Files to Modify:**
- `src/lib/auth/index.ts` (NEW)
- `src/middleware.ts`
- `src/app/api/employeeAuth/route.ts` (DELETE)
- `src/app/api/employerAuth/route.ts` (DELETE)
- All files in `src/app/employee/*` (UPDATE)
- All files in `src/app/employer/*` (UPDATE)
- `src/server/db/schema/base.ts` (UPDATE - change userId to Supabase UUID)

---

## Phase 2: Database Layer Unification

### Current State
- **Drizzle ORM**: Used for documents, study-agent, AI assistant
  - Tables: `document`, `pdfChunks`, `users`, `studyAgentMessages`, etc.
  - Connection: PostgreSQL with pgvector
- **Supabase**: Used for leases, organizations, profiles, comments
  - Tables: `leases`, `lease_analyses`, `organizations`, `profiles`, `lease_comments`
  - Connection: Supabase client with RLS

### Decision Required
**Option A: Migrate everything to Supabase (Recommended)**
- Pros: Single source of truth, RLS for security, built-in storage
- Cons: Need to migrate Drizzle schemas, update all queries
- Effort: High (3-4 days)

**Option B: Migrate everything to Drizzle**
- Pros: Type-safe queries, better developer experience
- Cons: Need to implement RLS manually, migrate Supabase data
- Effort: High (3-4 days)

**Recommendation: Option A (Supabase)** - Already has RLS, storage integration, and most core features

### Actions
1. **Audit database usage**
   - [ ] List all Drizzle queries (`db.select()`, `db.insert()`, etc.)
   - [ ] List all Supabase queries (`supabase.from()`)
   - [ ] Map table relationships

2. **Create unified database utilities**
   - [ ] Create `src/lib/db/index.ts` with:
     - `db.query(table)` - unified query builder
     - `db.insert(table, data)` - unified insert
     - `db.update(table, id, data)` - unified update
     - `db.delete(table, id)` - unified delete
   - [ ] Wrap Supabase client with consistent API

3. **Migrate Drizzle schemas to Supabase**
   - [ ] Create migration for `document` table → `documents` in Supabase
   - [ ] Create migration for `pdfChunks` table → `document_chunks` in Supabase
   - [ ] Create migration for `users` table → merge into `profiles`
   - [ ] Create migration for study-agent tables
   - [ ] Update all foreign key relationships

4. **Update all database queries**
   - [ ] Replace `db.select().from(users)` with `supabase.from('profiles')`
   - [ ] Replace `db.select().from(document)` with `supabase.from('documents')`
   - [ ] Update all API routes using Drizzle
   - [ ] Update all server components using Drizzle

5. **Remove Drizzle dependencies**
   - [ ] Remove `drizzle-orm` from package.json
   - [ ] Remove `src/server/db/` directory (or repurpose for Supabase utilities)
   - [ ] Remove drizzle config files

**Files to Modify:**
- `src/lib/db/index.ts` (NEW)
- `src/server/db/index.ts` (DELETE or REPURPOSE)
- `src/server/db/schema/*` (DELETE - migrate to Supabase migrations)
- All API routes using `db` from Drizzle (UPDATE ~15 files)
- `src/app/api/uploadDocument/route.ts` (UPDATE)
- `src/app/api/AIAssistant/route.ts` (UPDATE)
- `src/app/api/predictive-document-analysis/route.ts` (UPDATE)
- `src/app/api/study-agent/**/*.ts` (UPDATE)

---

## Phase 3: AI Provider Abstraction

### Current State
- **OpenAI**: Used in multiple places (AIAssistant, study-agent, predictive-analysis)
- **Groq**: Used for lease analysis (`src/lib/groq/*`)
- **Google AI**: Used in AIAssistant (`ChatGoogleGenerativeAI`)
- **Anthropic**: Used in AIAssistant (`ChatAnthropic`)

### Actions
1. **Create unified AI provider abstraction**
   - [ ] Create `src/lib/ai/index.ts` with:
     - `createChatModel(provider, model, options)` - unified model creation
     - `createEmbeddings(provider, options)` - unified embeddings
     - `Provider` enum: `'openai' | 'groq' | 'google' | 'anthropic'`
   - [ ] Support model selection via env vars or request params

2. **Consolidate lease analysis**
   - [ ] Review `src/lib/groq/lease-analyzer.ts` - can it use OpenAI?
   - [ ] If Groq is required for speed, keep but abstract
   - [ ] Create `src/lib/ai/lease-analyzer.ts` that uses abstraction

3. **Update all AI calls**
   - [ ] Replace direct `ChatOpenAI` instantiations
   - [ ] Replace `ChatAnthropic` instantiations
   - [ ] Replace `ChatGoogleGenerativeAI` instantiations
   - [ ] Use unified abstraction

4. **Standardize model selection**
   - [ ] Use env var: `AI_PROVIDER=openai` (default)
   - [ ] Allow per-request override for expensive operations
   - [ ] Document model capabilities and costs

**Files to Modify:**
- `src/lib/ai/index.ts` (NEW)
- `src/lib/ai/providers.ts` (NEW - provider implementations)
- `src/lib/groq/lease-analyzer.ts` (REFACTOR to use abstraction)
- `src/app/api/AIAssistant/route.ts` (UPDATE)
- `src/app/api/study-agent/**/*.ts` (UPDATE)
- `src/app/api/predictive-document-analysis/services/analysisEngine.ts` (UPDATE)

**Files to Consider Removing:**
- `src/lib/google-ai/client.ts` (if not needed)
- Consolidate Groq files into abstraction

---

## Phase 4: Document Upload & Processing Consolidation

### Current State
- **`/api/upload-lease`**: Handles lease PDFs, stores in Supabase Storage, creates lease records
- **`/api/uploadDocument`**: Handles general documents, uses Drizzle, creates embeddings
- Both have similar PDF processing logic (PDFLoader, text splitting)

### Actions
1. **Create shared PDF processing utilities**
   - [ ] Create `src/lib/pdf/processor.ts` with:
     - `processPDF(file, options)` - unified PDF processing
     - `extractText(file)` - text extraction
     - `splitIntoChunks(text, options)` - chunking logic
     - `generateEmbeddings(chunks)` - embedding generation
   - [ ] Support both OCR and direct text extraction

2. **Consolidate upload endpoints**
   - [ ] Keep `/api/upload-lease` for lease-specific uploads
   - [ ] Keep `/api/uploadDocument` for general documents
   - [ ] Extract shared logic to utilities
   - [ ] Ensure both use same PDF processing pipeline

3. **Unify storage**
   - [ ] Use Supabase Storage for both (already used for leases)
   - [ ] Create consistent bucket structure: `leases/`, `documents/`
   - [ ] Update `uploadDocument` to use Supabase Storage instead of UploadThing URLs

4. **Standardize database schema**
   - [ ] After Phase 2, both should use same `documents` table structure
   - [ ] `leases` table can reference `documents` table
   - [ ] Remove duplicate chunk storage

**Files to Modify:**
- `src/lib/pdf/processor.ts` (NEW)
- `src/app/api/upload-lease/route.ts` (REFACTOR)
- `src/app/api/uploadDocument/route.ts` (REFACTOR)
- `src/app/api/services/ocrService.ts` (KEEP but integrate)

---

## Phase 5: Remove Dead/Unused Code

### Current State
- Files marked `UNUSED_` in study-agent tools
- Potentially unused API endpoints
- Old migration files

### Actions
1. **Identify unused code**
   - [ ] Search for `UNUSED_` prefix
   - [ ] Find files with no imports/references
   - [ ] Check for commented-out code blocks
   - [ ] Identify deprecated API endpoints

2. **Remove unused files**
   - [ ] Delete `src/app/api/study-agent/agentic/tools/UNUSED_*.ts`
   - [ ] Remove unused components
   - [ ] Clean up old migration files (keep only latest)

3. **Archive instead of delete (optional)**
   - [ ] Create `archive/` directory
   - [ ] Move unused code there with README explaining why
   - [ ] Delete after 30 days if not needed

**Files to Delete:**
- `src/app/api/study-agent/agentic/tools/UNUSED_concept-explainer.ts`
- `src/app/api/study-agent/agentic/tools/UNUSED_flashcard-generator.ts`
- `src/app/api/study-agent/agentic/tools/UNUSED_progress-tracker.ts`
- `src/app/api/study-agent/agentic/tools/UNUSED_quiz-generator.ts`
- `src/app/api/study-agent/agentic/tools/UNUSED_study-plan.ts`
- `src/app/api/study-agent/agentic/tools/UNUSED_task-manager.ts`

---

## Phase 6: Error Handling Standardization

### Current State
- Some APIs use `src/lib/api-utils.ts` (Clerk-based routes)
- Some APIs use `NextResponse.json()` directly (Supabase-based routes)
- Inconsistent error messages and status codes

### Actions
1. **Enhance api-utils for Supabase**
   - [ ] Update `src/lib/api-utils.ts` to work with Supabase errors
   - [ ] Add Supabase-specific error mapping
   - [ ] Ensure all error types are covered

2. **Create API route wrapper**
   - [ ] Create `src/lib/api/handler.ts` with:
     - `apiHandler(handler)` - wraps route handlers
     - Automatic error catching
     - Consistent response format
     - Logging integration

3. **Migrate all API routes**
   - [ ] Update all routes to use `apiHandler`
   - [ ] Replace direct `NextResponse.json()` with utilities
   - [ ] Standardize error messages

**Files to Modify:**
- `src/lib/api-utils.ts` (ENHANCE)
- `src/lib/api/handler.ts` (NEW)
- All API route files (UPDATE ~40+ files)

---

## Phase 7: Feature Consolidation Review

### Current State
- **Study Agent**: AI-powered study assistant with tools
- **AI Assistant**: Document Q&A with RAG
- **Predictive Document Analysis**: Gap analysis and recommendations
- **Lease Analysis**: Specialized lease analysis

### Actions
1. **Clarify feature boundaries**
   - [ ] Document what each feature does
   - [ ] Identify overlapping functionality
   - [ ] Decide if consolidation is needed

2. **Consolidate if appropriate**
   - [ ] Study Agent vs AI Assistant: Can they share RAG logic?
   - [ ] Predictive Analysis vs Lease Analysis: Are they different enough?
   - [ ] Create shared utilities where appropriate

3. **Update documentation**
   - [ ] Update README with clear feature descriptions
   - [ ] Document API endpoints
   - [ ] Create architecture diagram

**Decision Points:**
- Keep Study Agent separate (different use case: learning vs document analysis)
- Keep Lease Analysis separate (specialized domain)
- Consolidate RAG/search logic (shared across features)

---

## Phase 8: Testing & Validation

### Actions
1. **Create test checklist**
   - [ ] Authentication flows (login, signup, protected routes)
   - [ ] Document upload (lease and general)
   - [ ] Lease analysis workflow
   - [ ] AI chat features
   - [ ] Study agent features
   - [ ] Team/organization features

2. **Run integration tests**
   - [ ] Test each major user flow
   - [ ] Verify database migrations
   - [ ] Check API responses

3. **Performance testing**
   - [ ] Measure API response times
   - [ ] Check database query performance
   - [ ] Verify RLS policies work correctly

---

## Implementation Order

### Week 1: Foundation
1. **Phase 1**: Authentication consolidation (2-3 days)
2. **Phase 2**: Database unification (3-4 days)
3. **Testing**: Verify core functionality still works

### Week 2: Consolidation
4. **Phase 3**: AI provider abstraction (1-2 days)
5. **Phase 4**: Document processing consolidation (1-2 days)
6. **Phase 5**: Remove dead code (0.5 days)
7. **Testing**: Verify all features work

### Week 3: Polish
8. **Phase 6**: Error handling standardization (1 day)
9. **Phase 7**: Feature consolidation review (1 day)
10. **Phase 8**: Comprehensive testing (1-2 days)

---

## Risk Mitigation

### Risks
1. **Breaking changes during migration**
   - Mitigation: Create feature flags, test on staging first
   
2. **Data loss during database migration**
   - Mitigation: Backup database, test migration script thoroughly
   
3. **Authentication disruption**
   - Mitigation: Support both systems temporarily, gradual migration

4. **Performance regression**
   - Mitigation: Benchmark before/after, optimize queries

### Rollback Plan
- Keep old code in `archive/` directory for 2 weeks
- Use feature flags to toggle between old/new implementations
- Database migrations should be reversible

---

## Success Metrics

- [ ] Single authentication system (Supabase Auth)
- [ ] Single database system (Supabase)
- [ ] Unified AI abstraction layer
- [ ] No duplicate upload/processing logic
- [ ] All unused code removed
- [ ] Consistent error handling across all APIs
- [ ] All tests passing
- [ ] No performance regressions
- [ ] Documentation updated

---

## Notes

- This is a major refactoring. Consider doing it incrementally.
- Test thoroughly after each phase.
- Keep stakeholders informed of progress.
- Consider pausing new features during refactoring.

---

## Questions to Resolve

1. **Authentication**: Confirm decision to use Supabase Auth (Option A)
2. **Database**: Confirm decision to use Supabase (Option A)
3. **AI Provider**: Should we standardize on one provider or keep abstraction?
4. **Study Agent**: Is this feature actively used? Should it be kept?
5. **Timeline**: Is 3 weeks acceptable, or should we extend?

---

**Next Steps:**
1. Review this plan with team
2. Resolve questions above
3. Create detailed tickets for Phase 1
4. Begin implementation
