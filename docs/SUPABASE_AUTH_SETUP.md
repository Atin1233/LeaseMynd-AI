# Supabase Auth Configuration for leasemynd.com

## Update Auth Redirect URLs

To ensure auth confirmations redirect to your production domain instead of localhost, you need to update the Site URL in Supabase.

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Project Dashboard
   - URL: https://cvkggvtoacsjnzrddnno.supabase.co/project/default
   - Or find it at: https://supabase.com/dashboard

2. Navigate to:
   **Authentication → Configuration → URL Configuration**

3. Update these fields:

   | Field | Value |
   |-------|-------|
   | **Site URL** | `https://leasemynd.com` |
   | **Redirect URLs** | Add these: |
   | | `https://leasemynd.com/dashboard` |
   | | `https://leasemynd.com/login` |
   | | `https://leasemynd.com/signup` |

4. Click **Save**

### Method 2: Using Supabase CLI

If you have the Supabase CLI installed locally:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref cvkggvtoacsjnzrddnno

# Update auth settings
supabase config set auth.site_url="https://leasemynd.com"
supabase config set auth.additional_redirect_urls="https://leasemynd.com/dashboard,https://leasemynd.com/login,https://leasemynd.com/signup"
```

### Method 3: Using cURL (GoTrue API)

```bash
curl -X PUT 'https://cvkggvtoacsjnzrddnno.supabase.co/auth/v1/admin/config' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "site_url": "https://leasemynd.com",
    "additional_redirect_urls": [
      "https://leasemynd.com/dashboard",
      "https://leasemynd.com/login",
      "https://leasemynd.com/signup"
    ]
  }'
```

## Verify the Change

After updating, test by:
1. Going to https://leasemynd.com/signup
2. Creating a new account
3. Checking the confirmation email - it should now redirect to leasemynd.com instead of localhost

## Current Settings in Your Code

Your `.env.local` already has:
```
NEXT_PUBLIC_SUPABASE_URL=https://cvkggvtoacsjnzrddnno.supabase.co
```

The issue was that Supabase itself was configured to redirect to localhost, which is a dashboard setting, not a code setting.
