# Run Comments Migration

## Quick Steps

### Option 1: Supabase Dashboard (Recommended - 2 minutes)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Copy & Paste SQL**
   - Copy the entire contents of `drizzle/0007_add_lease_comments.sql`
   - Paste into the SQL Editor

4. **Run Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for "Success" message

5. **Verify**
   - Check that the `lease_comments` table was created
   - You should see it in the "Table Editor" sidebar

### Option 2: Using psql (if you have database access)

```bash
# Get your connection string from Supabase Dashboard:
# Settings > Database > Connection string > URI

psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" < drizzle/0007_add_lease_comments.sql
```

### Option 3: Supabase CLI (if installed)

```bash
# Install Supabase CLI first:
# brew install supabase/tap/supabase  # macOS
# or download from: https://github.com/supabase/cli

supabase db push
```

---

## What This Migration Does

✅ Creates `lease_comments` table for team collaboration  
✅ Adds indexes for performance  
✅ Sets up Row Level Security (RLS) policies  
✅ Enables threaded comments (replies)  
✅ Configures permissions (users can edit/delete their own comments)

---

## After Migration

Once the migration is complete, the comment system will be fully functional:
- Users can comment on lease clauses
- Threaded replies work
- Edit/delete permissions are enforced
- Comments appear in the Team collaboration page

---

## Troubleshooting

**Error: "relation already exists"**
- The table already exists. Migration may have been run already.

**Error: "permission denied"**
- Make sure you're using the service role key or have admin access.

**Error: "foreign key constraint"**
- Make sure the `leases`, `clause_extractions`, and `profiles` tables exist first.
