# Dev Tier Testing Guide

**Purpose:** Quick guide for testing subscription tier features before payment integration is implemented.

**Created:** 2025-11-30
**For:** Epic 7 (AI Features) testing with different subscription tiers

---

## Dev-Only Endpoint

A **development/testing-only** endpoint has been added to manually update user subscription tiers:

```
PUT /api/user/subscription/admin-override
```

**Availability:**
- ✅ **Enabled:** `NODE_ENV=development` or `NODE_ENV=test`
- ❌ **Disabled:** `NODE_ENV=production` (returns 404)

**Location:** `backend/src/features/subscriptions/subscription.routes.ts`

---

## How to Use

### 1. Start Backend in Development Mode

Ensure your `.env` file has:
```bash
NODE_ENV=development
```

You should see this in the console on startup:
```
🧪 [DEV MODE] Admin subscription override endpoint enabled: PUT /api/user/subscription/admin-override
```

### 2. Login as User

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123@"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 2,
      "email": "test@example.com",
      "subscriptionTier": "free"
    }
  }
}
```

Save the token!

### 3. Upgrade to Basic Tier

```bash
PUT http://localhost:5000/api/user/subscription/admin-override
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "tier": "basic"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Subscription tier updated successfully",
    "previousTier": "free",
    "newTier": "basic",
    "warning": "This is a development-only endpoint. Payment integration required for production."
  }
}
```

### 4. Verify Tier Update

```bash
GET http://localhost:5000/api/user/subscription
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": "basic",
    "quotaStatus": {
      "aiInsights": {
        "used": 0,
        "limit": 50,
        "remaining": 50
      }
    }
  }
}
```

---

## Testing Different Tiers

### Free Tier (Default)
```json
{ "tier": "free" }
```

**Features:**
- AI Insights: 5/day
- Bill Comparisons: 1/day
- Goals: 3 max
- Provider: Gemini

### Basic Tier
```json
{ "tier": "basic" }
```

**Features:**
- AI Insights: 50/day
- Bill Comparisons: 10/day
- Goals: 10 max
- Provider: Gemini → GPT fallback

### Pro Tier
```json
{ "tier": "pro" }
```

**Features:**
- AI Insights: Unlimited (-1)
- Bill Comparisons: Unlimited (-1)
- Goals: Unlimited (-1)
- Provider: Gemini → GPT fallback
- Priority support

---

## Common Testing Scenarios

### Test AI Provider Routing

**Scenario:** Verify Gemini is used for all tiers

```bash
# 1. Upgrade to Basic
PUT /api/user/subscription/admin-override
{ "tier": "basic" }

# 2. Request AI Analysis
POST /api/ai/analyze
Authorization: Bearer <token>
{
  "timeRange": "30days"
}

# 3. Check response for provider
# Should show: "provider": "gemini-pro"
```

### Test Quota Limits

**Scenario:** Test Free tier quota (5 AI insights/day)

```bash
# 1. Set to Free tier
PUT /api/user/subscription/admin-override
{ "tier": "free" }

# 2. Make 5 AI insight requests
# (Loop 5 times)
POST /api/ai/analyze
{ "timeRange": "30days" }

# 3. 6th request should fail with quota error
POST /api/ai/analyze
# Expected: 429 Too Many Requests
# {
#   "error": {
#     "code": "QUOTA_EXCEEDED",
#     "message": "Daily AI insight limit reached (5/5)"
#   }
# }
```

### Test Unlimited Pro Features

```bash
# 1. Upgrade to Pro
PUT /api/user/subscription/admin-override
{ "tier": "pro" }

# 2. Make many AI requests
# No limit should apply

# 3. Check quota status
GET /api/user/subscription
# Should show: "remaining": -1 (unlimited)
```

---

## Error Handling

### Invalid Tier
```bash
PUT /api/user/subscription/admin-override
{ "tier": "invalid" }
```

**Response:** 400 Bad Request
```json
{
  "success": false,
  "error": {
    "message": "Invalid tier. Must be one of: free, basic, pro",
    "code": "INVALID_TIER"
  }
}
```

### Endpoint Not Available in Production

If `NODE_ENV=production`:
```bash
PUT /api/user/subscription/admin-override
{ "tier": "basic" }
```

**Response:** 404 Not Found
(Endpoint doesn't exist in production)

---

## Console Logging

When you update a tier, you'll see in the backend console:

```
🧪 [DEV ONLY] User 2 subscription tier updated: free → basic
```

This helps track tier changes during testing.

---

## Database Verification

You can also verify tier changes directly in the database:

```sql
-- Check user's current tier
SELECT id, email, subscription_tier, updated_at
FROM users
WHERE email = 'test@example.com';

-- Manually update tier via SQL (alternative to endpoint)
UPDATE users
SET subscription_tier = 'pro', updated_at = NOW()
WHERE email = 'test@example.com';
```

---

## Cleanup After Testing

To reset a user back to Free tier:

```bash
PUT /api/user/subscription/admin-override
Authorization: Bearer <token>
{ "tier": "free" }
```

Or via SQL:
```sql
UPDATE users SET subscription_tier = 'free' WHERE email = 'test@example.com';
```

---

## Security Notes

⚠️ **Important:**
- This endpoint is **automatically disabled** in production
- It requires authentication (valid JWT token)
- It only updates the **authenticated user's** tier
- It logs all tier changes to console
- No admin role required (it's for dev testing)

For **production admin tier management**, use Epic 13 Story 13.3 which includes:
- Admin role verification
- Audit logging
- Reason tracking
- Multi-user support

---

## Troubleshooting

### Endpoint returns 404

**Problem:** Endpoint not found

**Solution:** Check `NODE_ENV` in `.env`:
```bash
NODE_ENV=development
```

Restart backend after changing `.env`.

### Token expired

**Problem:** 401 Unauthorized

**Solution:** Login again to get fresh token:
```bash
POST /api/auth/login
```

### Tier not updating

**Problem:** Database update fails

**Solution:** Check backend logs for errors. Verify database connection.

---

## Next Steps

Once payment integration is ready (Epic 13 - Phase 3), this dev endpoint can be:
1. **Removed** (delete the code)
2. **Converted** to admin-only with proper role checks
3. **Kept** for internal testing with stricter access controls

Recommendation: **Convert to admin-only** in Epic 13 Story 13.3.

---

**Related Documentation:**
- Epic 10: Subscription Tier System (`docs/epics-phase2.md`)
- Epic 13: Payment & Billing Integration (`docs/epics-phase3-payment-billing.md`)
- Story 10.4: Subscription Management UI (`docs/stories/10-4-create-subscription-management-ui.md`)
