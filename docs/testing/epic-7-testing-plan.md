# Epic 7: AI Financial Advisor - Testing Plan

**Epic:** AI Financial Advisor (GPT-5.1 Primary)
**Stories:** 7.1, 7.2, 7.3, 7.4, 7.5
**Status:** Ready for Testing
**Created:** 2025-11-30

---

## Testing Strategy

We'll test in **3 phases**:

1. **Phase 1**: Without API keys (error handling, UI/UX)
2. **Phase 2**: With mock/test API keys (integration)
3. **Phase 3**: With production API keys (end-to-end)

---

## Phase 1: Testing Without API Keys

### Objective
Verify that the application handles missing API keys gracefully and UI works correctly.

### Setup
```bash
# Backend .env (NO API keys)
# Comment out or remove:
# OPENAI_API_KEY=
# GEMINI_API_KEY=
```

### Test Cases

#### TC1.1: Health Check Endpoint
```bash
# Start backend
cd backend
npm run dev

# Test health endpoint
curl http://localhost:5000/api/ai/health
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "gpt": false,
    "gemini": false,
    "status": "No AI providers available"
  }
}
```

**✅ Pass Criteria:**
- Endpoint returns 200 status
- Both providers show as unavailable
- No server crash
- Clear error messages in console

---

#### TC1.2: Frontend UI - Modal Opens
```bash
# Start frontend
cd frontend
npm run dev

# Navigate to: http://localhost:3000
```

**Test Steps:**
1. Login with test credentials
2. Navigate to Transactions page
3. Click "Get AI Insights" button

**Expected Result:**
- Modal opens successfully
- Shows "Insights" and "Chat" tabs
- Time range selector visible
- No crash or blank screen

**✅ Pass Criteria:**
- Modal renders correctly
- Tabs are clickable
- UI is responsive

---

#### TC1.3: Insights Tab - Error Handling
**Test Steps:**
1. Open AI Insights modal
2. Ensure on "Insights" tab
3. Click "Refresh Analysis" button

**Expected Result:**
- Loading state appears (spinner + skeleton)
- After ~5 seconds, error toast appears
- Error message: "Failed to generate AI analysis. Please try again later."
- Modal remains open
- UI doesn't crash

**✅ Pass Criteria:**
- Loading state shown
- Error handled gracefully
- Clear error message to user
- Can retry without refresh

---

#### TC1.4: Chat Tab - Error Handling
**Test Steps:**
1. Open AI Insights modal
2. Click "Chat" tab
3. Click a quick prompt OR type message
4. Click "Send"

**Expected Result:**
- Message appears in chat history (purple bubble)
- Loading dots appear
- After ~5 seconds, error toast appears
- Error message: "Failed to send message"
- Chat input remains enabled

**✅ Pass Criteria:**
- User message displayed
- Loading state shown
- Error handled gracefully
- Can send another message

---

#### TC1.5: Deep Thinking Toggle
**Test Steps:**
1. Open Chat tab
2. Check "Deep thinking" checkbox
3. Send a message

**Expected Result:**
- Checkbox state changes
- Same error handling as TC1.4
- No additional crashes

**✅ Pass Criteria:**
- Toggle works
- Error handling consistent

---

## Phase 2: Testing With Mock/Free API Keys

### Objective
Test integration with actual AI providers using test/free tier keys.

### Setup
```bash
# Backend .env
OPENAI_API_KEY=sk-proj-your-test-key-here
GEMINI_API_KEY=AIza-your-test-key-here

# Restart backend
npm run dev
```

### Test Cases

#### TC2.1: Health Check With Keys
```bash
curl http://localhost:5000/api/ai/health
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "gpt": true,
    "gemini": true,
    "status": "All AI providers operational"
  }
}
```

**✅ Pass Criteria:**
- Both providers return true
- Status shows operational
- Console shows connection success

---

#### TC2.2: Create Test Transactions
**Test Steps:**
1. Login to frontend
2. Create sample transactions:
   - **Income**: Salary - $3000 (11/01/2025)
   - **Expense**: Food & Dining - $250 (11/05/2025)
   - **Expense**: Transportation - $150 (11/10/2025)
   - **Expense**: Shopping - $200 (11/15/2025)
   - **Expense**: Entertainment - $100 (11/20/2025)

**✅ Pass Criteria:**
- 5 transactions created successfully
- Visible in Transactions list

---

#### TC2.3: Generate Insights - 30 Days
**Test Steps:**
1. Open AI Insights modal
2. Ensure "Insights" tab active
3. Select "Last 30 Days"
4. Click "Refresh Analysis"

**Expected Result:**
1. **Loading State** (30-60 seconds):
   - Spinner visible
   - "Analyzing your transactions..." message
   - Skeleton loader with pulse animation

2. **Success State**:
   - Analysis appears with 6 sections:
     * SPENDING OVERVIEW
     * CATEGORY BREAKDOWN
     * ANOMALY DETECTION
     * SAVINGS OPPORTUNITIES
     * BUDGET RECOMMENDATIONS
     * PERSONALIZED INSIGHTS
   - Markdown formatted (headers, bullets, bold)
   - Provider shown: "gemini-pro" or "gpt-4-turbo"
   - Token count displayed
   - Timestamp shown
   - Quota remaining displayed: "📊 Insights remaining: 4"

**✅ Pass Criteria:**
- Analysis generates within 60 seconds
- All 6 sections present
- References actual transaction amounts
- Markdown renders correctly
- Quota decremented (5 → 4)

---

#### TC2.4: Local Storage Caching
**Test Steps:**
1. After TC2.3, close modal
2. Reopen modal (click "Get AI Insights")
3. Observe insights tab

**Expected Result:**
- Previous analysis loads **instantly** (from cache)
- No loading state
- Same content as before
- Timestamp matches previous generation

**✅ Pass Criteria:**
- Cache loads in < 1 second
- Content identical
- "Refresh Analysis" still works to regenerate

---

#### TC2.5: Custom Date Range
**Test Steps:**
1. Open Insights tab
2. Select "Custom Range"
3. Set Start: 11/01/2025
4. Set End: 11/15/2025
5. Click "Refresh Analysis"

**Expected Result:**
- Analysis only includes transactions from 11/01 - 11/15
- Excludes 11/20 Entertainment transaction
- Total should be ~$700 (not $800)

**✅ Pass Criteria:**
- Date filtering works correctly
- Analysis reflects filtered data

---

#### TC2.6: Chat - Quick Prompt
**Test Steps:**
1. Switch to "Chat" tab
2. Click quick prompt: "How can I save more?"

**Expected Result:**
1. **Input Populated:**
   - Text appears in input field

2. **After Clicking Send:**
   - User message appears (purple bubble, right-aligned)
   - Loading dots appear
   - After 2-5 seconds, AI response appears (gray bubble, left-aligned)
   - Response references actual data:
     * "You spent $250 on Food & Dining..."
     * "Your total expenses were $700..."
   - Quota displayed: "💬 Chat quota: 3 remaining"

**✅ Pass Criteria:**
- Quick prompt populates input
- Response is contextual (mentions actual amounts)
- Response time: 2-5 seconds
- Quota decremented

---

#### TC2.7: Chat - Custom Message
**Test Steps:**
1. Type: "What's my biggest expense category?"
2. Click "Send"

**Expected Result:**
- Response mentions "Food & Dining" or "Shopping"
- Includes actual amount ($250 or $200)
- References transaction context

**✅ Pass Criteria:**
- Response is accurate
- Context-aware answer

---

#### TC2.8: Chat - Character Limit
**Test Steps:**
1. Type 500+ characters into chat input
2. Observe character counter

**Expected Result:**
- Input truncated at 500 characters
- Counter shows: "500/500"
- Cannot type more

**✅ Pass Criteria:**
- Enforces 500 char limit
- Counter updates in real-time

---

#### TC2.9: Chat - Conversation Limit
**Test Steps:**
1. Send 10 messages in chat (use quick prompts)
2. After 10th message, try to send 11th

**Expected Result:**
- After 8th message: Warning appears "2 messages remaining"
- After 10th message: Input disabled
- Error toast: "Maximum 10 messages per conversation"
- "Clear conversation" button enabled

**✅ Pass Criteria:**
- Limit enforced at 10 messages
- Clear warning shown
- Can clear and restart

---

#### TC2.10: Chat - Clear Conversation
**Test Steps:**
1. After TC2.9, click "Clear conversation"

**Expected Result:**
- All messages disappear
- Quick prompts reappear
- Input re-enabled
- Empty state shown: "Start a conversation"

**✅ Pass Criteria:**
- Conversation resets
- Can send new messages

---

#### TC2.11: Deep Thinking Mode
**Test Steps:**
1. Enable "Deep thinking" checkbox
2. Send message: "Give me a detailed budget analysis"
3. Observe response time and quality

**Expected Result:**
- Response takes longer (~5-10 seconds)
- Response is more detailed
- Provider shown: "gpt-4" (instead of "gpt-4-turbo")

**✅ Pass Criteria:**
- Deep thinking affects provider
- Response quality higher

---

#### TC2.12: Quota Exceeded
**Test Steps:**
1. Use up remaining quota (if Free tier: 5 insights total)
2. Try to generate another insight

**Expected Result:**
- Error toast: "Quota exceeded"
- Message includes: "Upgrade your plan or wait for quota reset"
- Shows reset time
- Quota status: "0 remaining"

**✅ Pass Criteria:**
- Quota enforced correctly
- Clear error message
- Shows upgrade path

---

#### TC2.13: PDF Export (Pro Tier)
**Test Steps:**
1. Change user tier to 'pro' in database:
   ```sql
   UPDATE users SET subscription_tier = 'pro' WHERE email = 'test@example.com';
   ```
2. Generate insights
3. Click "📄 Export to PDF"

**Expected Result:**
- PDF downloads: `ai-insights-2025-11-30.pdf`
- PDF contains:
  * Title: "AI Financial Insights"
  * Metadata: Generated date, provider, time range
  * Full insights content (markdown stripped)
  * Multi-page if needed

**✅ Pass Criteria:**
- PDF generates successfully
- Content formatted correctly
- Markdown cleaned

---

#### TC2.14: PDF Export (Free/Basic Tier)
**Test Steps:**
1. Ensure user tier is 'free' or 'basic'
2. Try to click PDF export button

**Expected Result:**
- Button shows: "🔒 Export to PDF (Pro)"
- Button is disabled (opacity 50%)
- Tooltip: "Pro feature - Upgrade to export"
- Error toast: "Export to PDF is a Pro feature"

**✅ Pass Criteria:**
- Feature gated correctly
- Clear upgrade prompt

---

## Phase 3: Production Testing

### Objective
Verify system works correctly with production API keys and real user data.

### Setup
```bash
# Backend .env (Production keys)
OPENAI_API_KEY=sk-proj-live-production-key
GEMINI_API_KEY=AIza-live-production-key
```

### Test Cases

#### TC3.1: Free Tier - Gemini Routing
**Test Steps:**
1. Login as Free tier user
2. Generate insights
3. Check response provider

**Expected Result:**
- Provider: "gemini-pro"
- Analysis quality: Good
- Response time: 30-60 seconds

**✅ Pass Criteria:**
- Correct provider used
- Quality acceptable

---

#### TC3.2: Basic Tier - GPT Routing
**Test Steps:**
1. Login as Basic tier user
2. Generate insights
3. Check response provider

**Expected Result:**
- Provider: "gpt-4-turbo"
- Analysis quality: Excellent
- Response time: 20-40 seconds

**✅ Pass Criteria:**
- Correct provider used
- Quality high

---

#### TC3.3: Large Transaction Dataset
**Test Steps:**
1. Create 100+ transactions (various dates)
2. Generate insights for 6 months

**Expected Result:**
- Analysis includes top 5 categories
- Transaction limit: 1000 (backend limit)
- Response time: < 60 seconds
- No timeout errors

**✅ Pass Criteria:**
- Handles large datasets
- Performance acceptable

---

#### TC3.4: Concurrent Users
**Test Steps:**
1. Multiple users generate insights simultaneously
2. Monitor quota per user
3. Check database locks

**Expected Result:**
- Each user has independent quota
- No race conditions
- Quotas tracked correctly

**✅ Pass Criteria:**
- Multi-user support works
- No quota leaks

---

#### TC3.5: Cost Monitoring
**Test Steps:**
1. Generate 10 insights (various tiers)
2. Check `user_requests` table
3. Calculate token usage

**Expected Result:**
- All requests logged
- Token counts recorded
- Provider tracked per request

**Query:**
```sql
SELECT
  provider,
  SUM(tokens_used) as total_tokens,
  COUNT(*) as request_count
FROM user_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

**✅ Pass Criteria:**
- All requests logged
- Token tracking accurate
- Can estimate costs

---

## Regression Testing

After any bug fixes, re-run:
- TC2.3 (Insights generation)
- TC2.6 (Chat quick prompt)
- TC2.9 (Conversation limit)
- TC2.12 (Quota exceeded)

---

## Performance Benchmarks

### Target Metrics
- **Insights Generation**: < 60 seconds
- **Chat Response**: < 5 seconds
- **Deep Thinking**: < 10 seconds
- **UI Load Time**: < 2 seconds
- **Cache Load**: < 1 second

### Load Testing
```bash
# Use Artillery or similar
artillery quick --count 10 --num 5 http://localhost:5000/api/ai/analyze
```

**Expected:**
- 10 users, 5 requests each
- No timeouts
- No 500 errors
- Quota enforced per user

---

## Bug Tracking Template

When reporting bugs:
```markdown
**Bug ID:** BUG-7-XXX
**Story:** 7.X
**Severity:** High/Medium/Low
**Environment:** Dev/Prod

**Steps to Reproduce:**
1. ...
2. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Screenshots:**
[attach]

**Console Errors:**
[paste]

**User Tier:** Free/Basic/Pro
**Browser:** Chrome/Firefox/Safari
```

---

## Test Data Setup Script

```sql
-- Create test user
INSERT INTO users (email, password_hash, subscription_tier, created_at)
VALUES
  ('test-free@example.com', 'hashed_password', 'free', NOW()),
  ('test-basic@example.com', 'hashed_password', 'basic', NOW()),
  ('test-pro@example.com', 'hashed_password', 'pro', NOW());

-- Create sample transactions for test-free user
INSERT INTO transactions (user_id, type, amount, category, date, description)
VALUES
  (1, 'income', 3000.00, 'Salary', '2025-11-01', 'Monthly salary'),
  (1, 'expense', 250.00, 'Food & Dining', '2025-11-05', 'Groceries'),
  (1, 'expense', 150.00, 'Transportation', '2025-11-10', 'Gas'),
  (1, 'expense', 200.00, 'Shopping', '2025-11-15', 'Clothes'),
  (1, 'expense', 100.00, 'Entertainment', '2025-11-20', 'Movies');
```

---

## Success Criteria

**Epic 7 is considered fully tested when:**

✅ All Phase 1 tests pass (no API keys)
✅ All Phase 2 tests pass (test keys)
✅ All Phase 3 tests pass (production)
✅ No critical bugs found
✅ Performance benchmarks met
✅ Zero 500 errors in logs
✅ Quota system working correctly
✅ Tier routing verified

---

## Test Execution Log

| Test ID | Status | Tested By | Date | Notes |
|---------|--------|-----------|------|-------|
| TC1.1   | ⬜ Pending | - | - | - |
| TC1.2   | ⬜ Pending | - | - | - |
| TC1.3   | ⬜ Pending | - | - | - |
| TC1.4   | ⬜ Pending | - | - | - |
| TC1.5   | ⬜ Pending | - | - | - |
| TC2.1   | ⬜ Pending | - | - | - |
| TC2.2   | ⬜ Pending | - | - | - |
| TC2.3   | ⬜ Pending | - | - | - |
| TC2.4   | ⬜ Pending | - | - | - |
| TC2.5   | ⬜ Pending | - | - | - |
| TC2.6   | ⬜ Pending | - | - | - |
| TC2.7   | ⬜ Pending | - | - | - |
| TC2.8   | ⬜ Pending | - | - | - |
| TC2.9   | ⬜ Pending | - | - | - |
| TC2.10  | ⬜ Pending | - | - | - |
| TC2.11  | ⬜ Pending | - | - | - |
| TC2.12  | ⬜ Pending | - | - | - |
| TC2.13  | ⬜ Pending | - | - | - |
| TC2.14  | ⬜ Pending | - | - | - |
| TC3.1   | ⬜ Pending | - | - | - |
| TC3.2   | ⬜ Pending | - | - | - |
| TC3.3   | ⬜ Pending | - | - | - |
| TC3.4   | ⬜ Pending | - | - | - |
| TC3.5   | ⬜ Pending | - | - | - |

---

## Next Steps

1. **Run Phase 1** (No API keys) - Can start immediately
2. **Obtain Test API Keys**:
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://aistudio.google.com/app/apikey
3. **Run Phase 2** (Test keys) - Integration testing
4. **Get Production Keys** - For final testing
5. **Run Phase 3** (Production) - End-to-end validation
6. **Document Results** - Update test log
7. **Fix Any Bugs** - Address issues found
8. **Mark Epic 7 as Done** - After all tests pass

---

**Document Version:** 1.0
**Last Updated:** 2025-11-30
**Maintained By:** Dev Team
