# Subscription Tier Migrations - Setup Guide

## Overview

This guide explains how to apply the subscription tier database migrations on your new development environment using Docker.

## Migrations Included

1. **`1764111758666_add-subscription-tier-column.js`**
   - Adds `subscription_tier` column to `users` table
   - Sets default value to 'free' for all existing users
   - Adds CHECK constraint: `subscription_tier IN ('free', 'basic', 'pro')`
   - Creates index on `subscription_tier` for efficient filtering

2. **`1764111827780_create-user-requests-table.js`**
   - Creates new `user_requests` table for tracking API usage
   - Links to users via foreign key with CASCADE delete
   - Includes indexes for efficient queries by user and request type

## Prerequisites

### Step 1: Start Docker PostgreSQL

```bash
# From project root directory
docker-compose up -d postgres

# Verify it's running
docker ps
```

You should see the `smart-budget-db` container running on port **54320**.

### Step 2: Set Up Backend Environment

```bash
# Navigate to backend directory
cd backend

# Copy the example .env file if you haven't already
cp .env.example .env

# The .env file should have Docker configuration (Option A):
# DATABASE_URL=postgresql://smartbudget:dev_password_123@localhost:54320/smart_budget
```

**Important:** Verify your `.env` file uses port **54320** (Docker) not 5432 (local PostgreSQL).

## Running the Migrations

### Apply Migrations (Up)

```bash
cd backend
npm run migrate:up
```

**Expected Output:**
```
> node-pg-migrate up

Running migration: 1764111758666_add-subscription-tier-column.js
Migration 1764111758666 completed successfully

Running migration: 1764111827780_create-user-requests-table.js
Migration 1764111827780 completed successfully
```

### Verify Migrations

```bash
# Connect to PostgreSQL
docker exec -it smart-budget-db psql -U smartbudget -d smart_budget

# Check users table structure
\d users

# You should see the new subscription_tier column:
# subscription_tier | character varying(20) | not null | default 'free'

# Check user_requests table
\d user_requests

# List all constraints
\d+ users

# Exit psql
\q
```

### Rollback Migrations (If Needed)

```bash
# Rollback last migration
npm run migrate:down

# Rollback specific number of migrations
npm run migrate:down -- --count 2
```

## Verification Checklist

After running migrations, verify:

- [x] `users` table has `subscription_tier` column
- [x] Default value is 'free'
- [x] CHECK constraint exists: `users_subscription_tier_check`
- [x] Index exists: `idx_users_subscription_tier`
- [x] `user_requests` table exists
- [x] Foreign key constraint links to `users.id`
- [x] Indexes exist: `idx_user_requests_user_time`, `idx_user_requests_type`

## Testing the Configuration

```bash
# Test TypeScript compilation
npm run build

# Start the backend (migrations auto-run on startup)
npm run dev
```

## Troubleshooting

### "Connection refused" Error

**Problem:** Backend can't connect to PostgreSQL

**Solution:**
```bash
# Verify Docker is running
docker ps

# Restart PostgreSQL container
docker-compose restart postgres

# Check logs
docker logs smart-budget-db
```

### "Migration already applied" Warning

**Problem:** Migrations have already run

**Solution:** This is expected if migrations were previously applied. No action needed.

### "Constraint violation" Error

**Problem:** Existing data conflicts with new constraints

**Solution:** This shouldn't happen since we're using DEFAULT values, but if it does:
```bash
# Check existing users
docker exec -it smart-budget-db psql -U smartbudget -d smart_budget -c "SELECT id, email, subscription_tier FROM users;"
```

## Next Steps

After migrations are successfully applied:

1. ✅ All existing users will have `subscription_tier = 'free'`
2. ✅ New users will default to 'free' tier
3. ✅ Ready to implement subscription-based features (Epic 10 stories 2-4)
4. ✅ Tier configuration available at `backend/src/config/subscriptions.ts`

## Configuration File

The subscription tier definitions are in:
```
backend/src/config/subscriptions.ts
```

This file exports:
- `SUBSCRIPTION_TIERS` - Complete tier configuration
- `getTierConfig(tierName)` - Get tier details
- `hasFeature(tierName, feature)` - Check feature availability
- `getDailyLimit(tierName, requestType)` - Get usage limits

## Story 10.1 Completion

Once migrations are verified:
- Story status moves from `in-progress` → `review`
- Ready for code review workflow
- Proceed to Epic 10 Story 10.2 (Request Quota Tracking)
