# Database Migration Instructions

## Adding Comments System

To enable the comment system on clauses, you need to run the database migration.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `drizzle/0007_add_lease_comments.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're in the project root
cd /path/to/PDR_AI_v2

# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Direct SQL Execution

You can also run the SQL directly in your database:

```bash
# Connect to your database and run:
psql your-connection-string < drizzle/0007_add_lease_comments.sql
```

### Verification

After running the migration, verify the table was created:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'lease_comments';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'lease_comments';
```

### What This Migration Does

1. Creates the `lease_comments` table with:
   - Support for comments on leases, clauses, and analyses
   - Threaded replies (parent_comment_id)
   - User tracking and timestamps

2. Creates indexes for performance:
   - On lease_id, clause_id, analysis_id
   - On parent_comment_id for reply queries
   - On user_id and created_at

3. Sets up Row Level Security (RLS):
   - Users can view comments in their organization
   - Users can create comments in their organization
   - Users can edit/delete their own comments
   - Admins/Owners can delete any comment in their org

### Troubleshooting

If you encounter errors:

1. **Table already exists**: Drop it first:
   ```sql
   DROP TABLE IF EXISTS lease_comments CASCADE;
   ```

2. **Permission errors**: Make sure you're running as a database admin

3. **RLS policy errors**: Check that your profiles table has the correct structure

### After Migration

Once the migration is complete, the comment system will be fully functional:
- Users can comment on clauses
- Threaded replies work
- Edit/delete permissions are enforced
- Comment counts appear on clauses
