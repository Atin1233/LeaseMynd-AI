# Development Setup - Broker Plan (Highest Tier)

When running on **localhost**, your organization is automatically set to the **Broker plan** (highest tier) with all features enabled.

## Automatic Features

### ✅ New Signups
- New organizations created on localhost automatically get the **Broker plan**
- Unlimited analyses (`monthly_analysis_limit: -1`)
- 20 team members allowed
- All features enabled

### ✅ Existing Organizations
- Existing organizations are automatically upgraded to Broker plan when you visit the dashboard
- Happens silently in the background
- No action needed

### ✅ Manual Upgrade (Optional)
If you need to manually upgrade your organization:

```bash
# Make a POST request to upgrade endpoint
curl -X POST http://localhost:3000/api/dev/upgrade-to-broker
```

Or visit: `http://localhost:3000/api/dev/upgrade-to-broker` (POST request)

## Broker Plan Features

- ✅ **Unlimited lease analyses** (no monthly limit)
- ✅ **20 team members** (vs 1 for free, 5 for team)
- ✅ **API access** (1000 requests/day)
- ✅ **White-label branding** (custom domain support)
- ✅ **Client sharing portals**
- ✅ **Advanced analytics & reporting**
- ✅ **All collaboration features**

## Production Behavior

In production (non-localhost), organizations default to the **Free plan** and require Stripe subscription to upgrade.

## Files Modified

- `src/app/(auth)/signup/page.tsx` - Auto-creates broker plan on localhost
- `src/app/dashboard/settings/page.tsx` - Auto-creates broker plan on localhost
- `src/app/dashboard/layout.tsx` - Auto-upgrades existing orgs to broker on localhost
- `src/app/api/dev/upgrade-to-broker/route.ts` - Manual upgrade endpoint (dev only)
