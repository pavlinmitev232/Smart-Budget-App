# Epic 7: AI Financial Advisor - Testing Summary & Next Steps

**Date:** 2025-11-30
**Current Status:** Phase 1 Partially Complete
**Overall Epic Status:** In Review

---

## 📊 Current Testing Status

### ✅ Phase 1: Without API Keys (Automated Tests)

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| TC1.1 | Health Check Endpoint | ⚠️ ISSUE FOUND | AIService throws error instead of graceful response |
| TC1.2 | Frontend Starts | ✅ PASS | Fixed missing react-is dependency |
| TC1.3 | Modal Opens | ⏭️ MANUAL | Requires browser testing |
| TC1.4 | Insights Error Handling | ⏭️ MANUAL | Requires browser testing |
| TC1.5 | Chat Error Handling | ⏭️ MANUAL | Requires browser testing |

**Automated Tests:** 2/5 complete (40%)
**Manual Tests Remaining:** 3 tests

---

## 🎯 How to Fully Test Epic 7

### Step 1: Complete Phase 1 Manual Testing (TODAY)

**What:** Test UI/UX without API keys
**Why:** Verify error handling works correctly
**Time:** ~15 minutes

**Actions:**
1. Create test user in database (SQL provided below)
2. Open http://localhost:3000 in browser
3. Login with test credentials
4. Follow manual testing guide: `docs/testing/epic-7-phase-1-manual-testing-guide.md`
5. Test 3 scenarios:
   - ✅ Modal opens without crash
   - ✅ Insights tab shows error when clicked
   - ✅ Chat tab shows error when sending message
6. Document results in `docs/testing/epic-7-phase-1-results.md`

**Test User SQL:**
\`\`\`sql
INSERT INTO users (email, password_hash, subscription_tier, created_at)
VALUES ('test@example.com', '$2b$10$RVAWkT5tmSAEF8FlAchtUew4ERR4uzLIkoJsfgHvauJiqTC6FHM1S', 'free', NOW())
ON CONFLICT (email) DO NOTHING;
\`\`\`

**Credentials:**
- Email: test@example.com
- Password: TestPass123!

**Quick Test Steps:**
1. Login → Navigate to Transactions → Click "Get AI Insights"
2. Verify modal opens (✅ or ❌)
3. Click "Generate Analysis" → Verify error toast appears (✅ or ❌)
4. Switch to Chat tab → Send message → Verify error toast appears (✅ or ❌)

---

### Step 2: Obtain API Keys (REQUIRED FOR PHASE 2)

**What:** Get free API keys from OpenAI and Google
**Why:** Test actual AI functionality
**Time:** ~10 minutes

#### OpenAI (GPT-4)
1. Go to: https://platform.openai.com/signup
2. Create free account
3. Navigate to: https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Copy key (starts with `sk-proj-...`)
6. **Free Tier:** $5 in free credits for 3 months

#### Google Gemini
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key (starts with `AIza...`)
5. **Free Tier:** 60 requests per minute (generous!)

#### Add to .env
\`\`\`bash
cd backend
\`\`\`

Add to `.env` file:
\`\`\`
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
GEMINI_API_KEY=AIzaYOUR_KEY_HERE
\`\`\`

**Restart backend:**
\`\`\`bash
# Stop current backend (Ctrl+C)
npm run dev
\`\`\`

You should see:
\`\`\`
✅ OpenAI API key configured
✅ Gemini API key configured
\`\`\`

---

### Step 3: Run Phase 2 Tests (WITH API KEYS)

**What:** Test actual AI functionality end-to-end
**Why:** Verify AI insights and chat work correctly
**Time:** ~30 minutes

**Setup:**
\`\`\`bash
# Verify backend running with API keys
curl http://localhost:5000/api/ai/health
# Should return: "gpt": true, "gemini": true

# Verify frontend running
curl http://localhost:3000
# Should return: HTTP 200
\`\`\`

**14 Test Cases to Execute:**

#### TC2.1: Health Check with API Keys
\`\`\`bash
curl http://localhost:5000/api/ai/health
\`\`\`
**Expected:** `{ "success": true, "data": { "gpt": true, "gemini": true } }`

#### TC2.2: Generate AI Insights (Free Tier - Gemini)
1. Login as test@example.com (free tier)
2. Navigate to Transactions
3. Click "Get AI Insights"
4. Click "Generate Analysis"
5. **Expected:**
   - Loading state appears
   - Analysis completes within 5-10 seconds
   - Shows financial insights (income/expenses summary)
   - Shows spending analysis
   - Shows recommendations
   - Provider: "gemini-pro"
   - Quota shows: "4/5 remaining"

#### TC2.3: Quota Tracking (Free Tier)
1. Refresh analysis 4 more times
2. **Expected:**
   - First refresh: 3/5 remaining
   - Second: 2/5 remaining
   - Third: 1/5 remaining
   - Fourth: 0/5 remaining
   - Fifth: Error "Daily limit reached"

#### TC2.4: Chat with AI (Free Tier - Gemini)
1. Switch to "Chat" tab
2. Click quick prompt: "How can I save more?"
3. **Expected:**
   - Loading appears (bouncing dots)
   - Response within 5-10 seconds
   - Personalized advice based on transactions
   - Quota decreases

#### TC2.5: Deep Thinking Toggle (Chat)
1. Enable "Deep thinking" checkbox
2. Send message: "Should I adjust my budget?"
3. **Expected:**
   - Takes longer (~10-15 seconds)
   - More detailed, thoughtful response
   - Still uses Gemini (free tier can't access GPT)

#### TC2.6: Conversation History
1. Send 3 messages in sequence:
   - "What's my biggest expense?"
   - "How can I reduce it?"
   - "What's a realistic savings goal?"
2. **Expected:**
   - All messages appear in chat
   - AI remembers context from previous messages
   - Conversation flows naturally

#### TC2.7: 10 Message Limit
1. Send 10 messages total
2. Try to send 11th message
3. **Expected:**
   - Error toast: "Maximum 10 messages per conversation"
   - "Clear conversation" button appears
   - Can click "Clear" to reset

#### TC2.8: Upgrade User to Basic Tier
\`\`\`sql
UPDATE users SET subscription_tier = 'basic' WHERE email = 'test@example.com';
\`\`\`
1. Logout and login again
2. Generate insights
3. **Expected:**
   - Provider changes to "gpt-4-turbo"
   - Quota shows: "49/50 remaining"
   - Response is faster (~2-3 seconds)
   - Higher quality insights

#### TC2.9: Deep Thinking with GPT (Basic Tier)
1. Chat tab → Enable "Deep thinking"
2. Send complex question
3. **Expected:**
   - Provider: "gpt-4"
   - Takes longer (~8-12 seconds)
   - More comprehensive analysis
   - Extended reasoning visible

#### TC2.10: Upgrade to Pro Tier (Unlimited)
\`\`\`sql
UPDATE users SET subscription_tier = 'pro' WHERE email = 'test@example.com';
\`\`\`
1. Logout and login again
2. Generate insights
3. **Expected:**
   - Quota shows: "Unlimited"
   - No daily limit
   - Uses GPT-4 Turbo

#### TC2.11: Date Range Filter
1. Insights tab → Change date range to "Last 7 days"
2. Generate analysis
3. **Expected:**
   - Analysis reflects only last 7 days
   - Correctly shows recent patterns
   - Date range persists when refreshed

#### TC2.12: No Transactions Scenario
1. Create new test user with NO transactions
2. Try to generate insights
3. **Expected:**
   - Error message: "No transactions found"
   - Suggestion to add transactions first
   - Modal doesn't crash

#### TC2.13: Provider Fallback (Simulate)
1. Temporarily break OPENAI_API_KEY (set to invalid)
2. Generate insights as Basic user
3. **Expected:**
   - Falls back to Gemini
   - Still works (graceful degradation)
   - OR: Shows clear error message

#### TC2.14: Quota Reset After 24 Hours
1. Check quota status
2. Wait 24 hours OR manually reset:
\`\`\`sql
DELETE FROM user_requests WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
\`\`\`
3. **Expected:**
   - Quota resets to full amount
   - Can generate insights again

---

### Step 4: Phase 3 Testing (PRODUCTION-LIKE)

**What:** Test in production-like environment
**Why:** Verify deployment readiness
**Time:** ~20 minutes

**Test Cases:**

#### TC3.1: High Volume Testing
- Generate 20 insights rapidly
- Verify no rate limiting issues
- Check API costs in OpenAI dashboard

#### TC3.2: Error Recovery
- Disconnect internet mid-request
- Verify error handling
- Reconnect and retry

#### TC3.3: Multiple Users
- Create 3 different users
- Each generates insights simultaneously
- Verify quota tracking is per-user

#### TC3.4: Performance Testing
- Measure response times:
  - Gemini: < 10 seconds
  - GPT-4 Turbo: < 5 seconds
  - GPT-4 Deep: < 15 seconds

#### TC3.5: Security Testing
- Try accessing AI endpoints without auth token
- Verify 401 Unauthorized
- Try manipulating quota in requests
- Verify server-side validation

---

## 📋 Testing Checklist

### Phase 1 (Without API Keys)
- [x] TC1.1: Health check endpoint (⚠️ known issue)
- [x] TC1.2: Frontend starts (✅ fixed)
- [ ] TC1.3: Modal opens
- [ ] TC1.4: Insights error handling
- [ ] TC1.5: Chat error handling

### Phase 2 (With API Keys)
- [ ] TC2.1: Health check with keys
- [ ] TC2.2: Generate insights (Free tier)
- [ ] TC2.3: Quota tracking
- [ ] TC2.4: Chat with AI
- [ ] TC2.5: Deep thinking toggle
- [ ] TC2.6: Conversation history
- [ ] TC2.7: 10 message limit
- [ ] TC2.8: Basic tier upgrade
- [ ] TC2.9: Deep thinking GPT
- [ ] TC2.10: Pro tier unlimited
- [ ] TC2.11: Date range filter
- [ ] TC2.12: No transactions scenario
- [ ] TC2.13: Provider fallback
- [ ] TC2.14: Quota reset

### Phase 3 (Production)
- [ ] TC3.1: High volume testing
- [ ] TC3.2: Error recovery
- [ ] TC3.3: Multiple users
- [ ] TC3.4: Performance testing
- [ ] TC3.5: Security testing

**Total Tests:** 24
**Completed:** 2 (8%)
**Remaining:** 22 (92%)

---

## 🚀 Recommended Testing Path

### Today (30 minutes)
1. ✅ Complete Phase 1 manual tests (TC1.3-TC1.5) - **15 min**
2. ✅ Obtain API keys from OpenAI + Gemini - **10 min**
3. ✅ Add keys to .env and restart backend - **5 min**

### Tomorrow (1 hour)
4. ✅ Run Phase 2 core tests (TC2.1-TC2.7) - **30 min**
5. ✅ Test tier upgrades (TC2.8-TC2.10) - **20 min**
6. ✅ Test edge cases (TC2.11-TC2.14) - **10 min**

### Later This Week (30 minutes)
7. ✅ Run Phase 3 production tests (TC3.1-TC3.5) - **30 min**
8. ✅ Document final results
9. ✅ Mark Epic 7 as "done" in sprint-status.yaml

---

## 🐛 Known Issues

### Issue #1: AIService Constructor Throws Error (Non-Blocking)
- **Location:** backend/src/services/ai.service.ts:44-48
- **Impact:** Health check returns 500 instead of graceful response when no keys
- **Status:** Documented, not blocking testing
- **Fix:** Optional - remove throw statement, use warnings
- **Priority:** Low (only affects development without keys)

### Issue #2: Missing react-is Dependency
- **Status:** ✅ FIXED
- **Fix Applied:** npm install react-is --legacy-peer-deps
- **Follow-up:** Should add to package.json permanently

---

## 📝 Testing Documentation

All testing documents are in `docs/testing/`:

1. **epic-7-testing-plan.md** - Complete 3-phase testing strategy with all 24 test cases
2. **epic-7-phase-1-results.md** - Automated test results (TC1.1-TC1.2 complete)
3. **epic-7-phase-1-manual-testing-guide.md** - Step-by-step manual testing instructions
4. **epic-7-testing-summary.md** - This document (overview and roadmap)

---

## ✅ Definition of "Fully Tested"

Epic 7 will be considered **fully tested** when:

- ✅ All 24 test cases executed (5 Phase 1 + 14 Phase 2 + 5 Phase 3)
- ✅ All results documented with screenshots
- ✅ No critical bugs found (medium/low bugs documented)
- ✅ AI insights work for Free, Basic, and Pro tiers
- ✅ Chat interface functions correctly
- ✅ Quota tracking accurate across all tiers
- ✅ Error handling verified
- ✅ Performance meets targets (< 10s response times)
- ✅ Security validated (auth required, server-side quota checks)

---

## 🎯 Quick Start: Test Right Now

**Want to start testing immediately? Here's the fastest path:**

### 1. Create Test User (30 seconds)
\`\`\`bash
# Connect to your PostgreSQL database and run:
INSERT INTO users (email, password_hash, subscription_tier, created_at)
VALUES ('test@example.com', '$2b$10$RVAWkT5tmSAEF8FlAchtUew4ERR4uzLIkoJsfgHvauJiqTC6FHM1S', 'free', NOW())
ON CONFLICT (email) DO NOTHING;
\`\`\`

### 2. Test Without API Keys (5 minutes)
\`\`\`bash
# Both servers should already be running
# Frontend: http://localhost:3000
# Backend: http://localhost:5000

# Open browser
open http://localhost:3000

# Login: test@example.com / TestPass123!
# Go to Transactions → Click "Get AI Insights"
# Try to generate insights → Should show error (expected!)
# Try chat → Should show error (expected!)
\`\`\`

**✅ If errors appear = Phase 1 PASS**
**❌ If app crashes = Phase 1 FAIL (needs fixing)**

### 3. Get API Keys and Test Real AI (15 minutes)
\`\`\`bash
# Get keys from:
# - OpenAI: https://platform.openai.com/api-keys
# - Gemini: https://aistudio.google.com/app/apikey

# Add to backend/.env:
echo "OPENAI_API_KEY=sk-proj-..." >> backend/.env
echo "GEMINI_API_KEY=AIza..." >> backend/.env

# Restart backend
cd backend
npm run dev

# Test in browser again
# Login → Transactions → Get AI Insights → Generate Analysis
# Should work now! 🎉
\`\`\`

---

**Ready to start testing?**

👉 **Next Action:** Run the SQL above to create test user, then open http://localhost:3000 and start with Phase 1 manual tests!
