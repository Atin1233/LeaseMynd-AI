# Architecture Comparison: Current vs Target

## Current Architecture (Complex)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ Employee/   │         │ Dashboard/   │                 │
│  │ Employer     │         │ Lease Pages │                 │
│  │ Pages        │         │              │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         │ Clerk Auth             │ Supabase Auth            │
│         │                        │                          │
└─────────┼────────────────────────┼──────────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ /api/        │         │ /api/        │                 │
│  │ employeeAuth │         │ analyze-lease│                 │
│  │ employerAuth │         │ upload-lease │                 │
│  │ uploadDocument│        │ leases      │                 │
│  │ AIAssistant  │         │ comments    │                 │
│  │ study-agent  │         │             │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         │ Drizzle ORM            │ Supabase Client          │
│         │                        │                          │
└─────────┼────────────────────────┼──────────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ PostgreSQL   │         │ Supabase     │                 │
│  │ (Drizzle)    │         │ (Native)     │                 │
│  │              │         │              │                 │
│  │ - document   │         │ - leases     │                 │
│  │ - pdfChunks  │         │ - profiles   │                 │
│  │ - users      │         │ - orgs       │                 │
│  │ - study-agent│         │ - comments   │                 │
│  └──────────────┘         └──────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDERS                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ OpenAI   │  │ Groq     │  │ Google   │  │ Anthropic│     │
│  │          │  │          │  │ AI      │  │          │     │
│  │ (Multiple│  │ (Lease   │  │ (AIAss  │  │ (AIAss   │     │
│  │  places) │  │ Analysis)│  │ istant) │  │ istant)  │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Problems:**
- ❌ Two auth systems (Clerk + Supabase)
- ❌ Two database systems (Drizzle + Supabase)
- ❌ Four AI providers used inconsistently
- ❌ Duplicate upload logic
- ❌ Inconsistent error handling

---

## Target Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ Employee/   │         │ Dashboard/   │                 │
│  │ Employer     │         │ Lease Pages │                 │
│  │ Pages        │         │              │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         └──────────┬──────────────┘                          │
│                    │                                        │
│                    │ Unified Auth (Supabase)                │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────┐          │
│  │         Unified API Utilities                 │          │
│  │  - src/lib/auth/index.ts (auth helpers)      │          │
│  │  - src/lib/api/handler.ts (error handling)  │          │
│  │  - src/lib/db/index.ts (database helpers)   │          │
│  └──────────────────────────────────────────────┘          │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ /api/        │         │ /api/        │                 │
│  │ upload-lease │         │ analyze-lease│                 │
│  │ uploadDocument│        │ leases      │                 │
│  │ AIAssistant  │         │ comments    │                 │
│  │ study-agent  │         │             │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         └──────────┬─────────────┘                          │
│                    │                                        │
│                    │ Unified DB (Supabase)                  │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────┐              │
│  │         Supabase (Single Source)           │              │
│  │                                            │              │
│  │  - leases                                  │              │
│  │  - lease_analyses                          │              │
│  │  - profiles (users)                        │              │
│  │  - organizations                            │              │
│  │  - documents (migrated from Drizzle)        │              │
│  │  - document_chunks (migrated)               │              │
│  │  - study_agent_* (migrated)                 │              │
│  │  - lease_comments                           │              │
│  └────────────────────────────────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDERS                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────┐              │
│  │      Unified AI Abstraction Layer          │              │
│  │      src/lib/ai/index.ts                   │              │
│  │                                            │              │
│  │  createChatModel(provider, model, opts)    │              │
│  │  createEmbeddings(provider, opts)          │              │
│  │                                            │              │
│  │  Supports: OpenAI, Groq, Google, Anthropic│              │
│  │  Configurable via env vars                 │              │
│  └──────────────────────────────────────────┘              │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ OpenAI   │  │ Groq     │  │ Google   │  │ Anthropic│     │
│  │ (Default) │  │ (Fast)   │  │ AI      │  │ (Alt)    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Single auth system (Supabase)
- ✅ Single database system (Supabase)
- ✅ Unified AI abstraction (configurable)
- ✅ Shared utilities (auth, DB, errors)
- ✅ Consistent patterns across codebase

---

## Key Changes Summary

### 1. Authentication
**Before:** Clerk (employee/employer) + Supabase (leases)  
**After:** Supabase Auth (everything)

### 2. Database
**Before:** Drizzle ORM (documents) + Supabase (leases)  
**After:** Supabase (everything)

### 3. AI Providers
**Before:** Direct instantiation in multiple places  
**After:** Unified abstraction layer with configurable providers

### 4. Upload Logic
**Before:** Duplicate PDF processing in 2 endpoints  
**After:** Shared PDF processing utilities

### 5. Error Handling
**Before:** Inconsistent (some use api-utils, some don't)  
**After:** Standardized via api-utils + handler wrapper

---

## Migration Path

```
Current State
    │
    ├─→ Phase 1: Auth Consolidation
    │       │
    │       └─→ Single Auth System
    │
    ├─→ Phase 2: Database Unification
    │       │
    │       └─→ Single Database System
    │
    ├─→ Phase 3: AI Abstraction
    │       │
    │       └─→ Unified AI Layer
    │
    ├─→ Phase 4: Code Consolidation
    │       │
    │       ├─→ Shared PDF Processing
    │       ├─→ Standardized Error Handling
    │       └─→ Remove Dead Code
    │
    └─→ Target State (Simplified)
```

---

## File Structure Comparison

### Before (Scattered)
```
src/
├── app/
│   ├── api/
│   │   ├── employeeAuth/        (Clerk)
│   │   ├── employerAuth/       (Clerk)
│   │   ├── uploadDocument/      (Drizzle)
│   │   ├── upload-lease/        (Supabase)
│   │   ├── AIAssistant/        (Multiple AI)
│   │   └── analyze-lease/       (Groq)
│   ├── employee/                (Clerk auth)
│   ├── employer/                (Clerk auth)
│   └── dashboard/               (Supabase auth)
├── lib/
│   ├── supabase/                (Supabase client)
│   ├── groq/                    (Groq client)
│   └── google-ai/               (Google client)
└── server/
    └── db/                      (Drizzle schema)
```

### After (Organized)
```
src/
├── app/
│   ├── api/
│   │   ├── upload-lease/        (Uses shared utils)
│   │   ├── uploadDocument/      (Uses shared utils)
│   │   ├── AIAssistant/        (Uses AI abstraction)
│   │   └── analyze-lease/       (Uses AI abstraction)
│   ├── employee/                (Supabase auth)
│   ├── employer/                (Supabase auth)
│   └── dashboard/               (Supabase auth)
├── lib/
│   ├── auth/                    (Unified auth)
│   ├── db/                      (Unified DB)
│   ├── ai/                      (Unified AI)
│   ├── pdf/                     (Shared processing)
│   └── api/                     (Error handling)
└── (No server/db - uses Supabase)
```

---

## Benefits of Simplified Architecture

1. **Maintainability**: Single source of truth for each concern
2. **Consistency**: Same patterns across all features
3. **Testability**: Easier to mock and test unified interfaces
4. **Performance**: Fewer dependencies, optimized queries
5. **Developer Experience**: Clear patterns, less confusion
6. **Security**: RLS policies in one place (Supabase)
7. **Scalability**: Easier to optimize and scale

---

## Questions?

See `SIMPLIFICATION_PLAN.md` for detailed implementation steps.
