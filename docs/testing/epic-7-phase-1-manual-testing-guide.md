# Epic 7: Phase 1 Manual Testing Guide

**Test Date:** 2025-11-30
**Tester:** User
**Environment:** Development (No API Keys)
**Backend:** http://localhost:5000
**Frontend:** http://localhost:3000

---

## Prerequisites

### 1. Create Test User

Run this SQL in your PostgreSQL database:

```sql
INSERT INTO users (email, password_hash, subscription_tier, created_at)
VALUES ('test@example.com', '$2b$10$RVAWkT5tmSAEF8FlAchtUew4ERR4uzLIkoJsfgHvauJiqTC6FHM1S', 'free', NOW())
ON CONFLICT (email) DO NOTHING;
```

**Test Credentials:**
- **Email:** test@example.com
- **Password:** TestPass123!
- **Tier:** Free (5 AI insights per day)

### 2. Add Test Transactions

To test the AI features properly, you need some transactions in the system:

```sql
-- Get the user ID first
SELECT id FROM users WHERE email = 'test@example.com';

-- Replace USER_ID with the actual ID from above query
INSERT INTO transactions (user_id, type, amount, category, date, description, created_at)
VALUES
  (USER_ID, 'expense', 150.50, 'Food & Dining', '2025-11-15', 'Grocery shopping', NOW()),
  (USER_ID, 'expense', 250.00, 'Transportation', '2025-11-10', 'Gas and parking', NOW()),
  (USER_ID, 'expense', 500.00, 'Healthcare', '2025-11-12', 'Doctor visit', NOW()),
  (USER_ID, 'income', 2500.00, 'Salary', '2025-11-01', 'Monthly salary', NOW()),
  (USER_ID, 'expense', 100.00, 'Entertainment', '2025-11-14', 'Movie tickets', NOW()),
  (USER_ID, 'expense', 75.00, 'Shopping', '2025-11-13', 'Clothes', NOW());
```

### 3. Verify Servers Running

```bash
# Check backend
curl http://localhost:5000/api/health

# Check frontend
curl http://localhost:3000
```

Both should return HTTP 200.

---

## Test Cases

### TC1.3: Verify Modal Opens Without Crash

**Objective:** Ensure the AI Insights modal renders correctly even without API keys configured.

**Steps:**

1. Open browser to http://localhost:3000
2. Login with:
   - Email: `test@example.com`
   - Password: `TestPass123!`
3. After login, navigate to the **Transactions** page
4. Locate the **"Get AI Insights"** button (should be visible in the top section)
5. Click the **"Get AI Insights"** button

**Expected Results:**

✅ **PASS** if:
- Modal opens without crash
- Modal displays two tabs: **"📊 Insights"** and **"💬 Chat"**
- Insights tab is active by default
- Modal shows "Generate Analysis" button
- No JavaScript errors in browser console
- UI is fully functional

❌ **FAIL** if:
- Modal doesn't open
- White screen / blank modal
- JavaScript errors in console
- Missing tabs or buttons
- UI freezes or crashes

**Notes:**
- [ ] Modal opened: Yes / No
- [ ] Tabs visible: Yes / No
- [ ] Console errors: Yes / No
- [ ] Screenshot attached: Yes / No

---

### TC1.4: Test Insights Error Handling

**Objective:** Verify error handling when trying to generate insights without API keys.

**Prerequisites:** TC1.3 completed successfully (modal is open)

**Steps:**

1. Ensure you're on the **"📊 Insights"** tab
2. Click the **"Refresh Analysis"** button (or "Generate Analysis" if first time)
3. Wait for the response (should be quick since API will fail immediately)

**Expected Results:**

✅ **PASS** if:
- Error toast notification appears
- Toast shows a clear error message (e.g., "AI health check failed" or "AI providers not available")
- Modal remains functional (doesn't crash)
- "Refresh Analysis" button is still clickable
- No JavaScript errors beyond the expected API failure

❌ **FAIL** if:
- No error message shown
- Modal crashes or freezes
- White screen appears
- Uncaught JavaScript errors in console
- Button becomes permanently disabled

**Notes:**
- [ ] Error toast appeared: Yes / No
- [ ] Error message: _______________
- [ ] Modal still functional: Yes / No
- [ ] Console errors (unexpected): Yes / No
- [ ] Screenshot attached: Yes / No

---

### TC1.5: Test Chat Error Handling

**Objective:** Verify chat interface handles missing API keys gracefully.

**Prerequisites:** TC1.3 completed successfully (modal is open)

**Steps:**

1. Click the **"💬 Chat"** tab
2. Verify the chat interface loads correctly
3. You should see:
   - Quick prompts: "How can I save more?", "What's my biggest expense?", etc.
   - Empty message area with chat icon
   - Text input at bottom
   - Character counter showing "0/500"
4. Click one of the quick prompts OR type a custom message (e.g., "How am I doing financially?")
5. Click **Send** button or press **Enter**
6. Wait for response

**Expected Results:**

✅ **PASS** if:
- Chat interface renders correctly
- Quick prompts are clickable
- Text input accepts input
- Character counter updates as you type
- Error toast appears after sending message
- Error message is clear (e.g., "Chat failed" or "AI providers not available")
- Your message appears in chat history (as a user message)
- No assistant response appears (because of API failure)
- Chat remains functional after error
- Can send another message without crash

❌ **FAIL** if:
- Chat interface doesn't load
- Quick prompts don't work
- Input field is broken
- No error message after sending
- Chat crashes after error
- Cannot send additional messages
- White screen or frozen UI

**Notes:**
- [ ] Chat UI loaded: Yes / No
- [ ] Quick prompts worked: Yes / No
- [ ] Message sent successfully: Yes / No
- [ ] Error toast appeared: Yes / No
- [ ] Error message: _______________
- [ ] Can send another message: Yes / No
- [ ] Console errors (unexpected): Yes / No
- [ ] Screenshot attached: Yes / No

---

## Additional Exploratory Tests

While you're testing, also check these scenarios:

### Chat Features

- [ ] **Character Limit:** Type 501 characters and verify input is truncated or prevented
- [ ] **Deep Thinking Toggle:** Verify checkbox is visible and toggleable (even though it won't work without API keys)
- [ ] **Clear Conversation:** Add a message, then click "Clear conversation" - verify messages are cleared
- [ ] **Multiple Messages:** Send 2-3 messages and verify they stack correctly in the chat history
- [ ] **Empty Message:** Try sending an empty message - should be prevented

### Insights Features

- [ ] **Quota Display:** Check if quota remaining is shown somewhere in the UI
- [ ] **Refresh Button:** After first click, verify button text changes to "Refresh Analysis"
- [ ] **Modal Close:** Click X or outside modal to close, then reopen - verify state persists/resets correctly

### General UI/UX

- [ ] **Responsive Design:** Resize browser window - modal should adapt
- [ ] **Tab Switching:** Switch between Insights and Chat tabs multiple times - no crashes
- [ ] **Multiple Opens:** Close and reopen modal several times - no memory leaks or errors
- [ ] **Logout/Login:** Logout, login again, reopen modal - verify it works

---

## Recording Results

For each test case, record:

1. **Status:** ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
2. **Screenshots:** Attach screenshots showing:
   - Modal opened with both tabs
   - Error toast messages
   - Chat interface with messages
   - Any unexpected errors
3. **Console Errors:** Open DevTools Console (F12), check for errors
   - Expected errors: API failures (404, 500 from /api/ai/*)
   - Unexpected errors: React errors, undefined variables, etc.
4. **Notes:** Any observations, odd behavior, suggestions

---

## Expected Warnings (Not Errors)

These are EXPECTED to appear and are NOT failures:

**Backend Console:**
```
⚠️  OPENAI_API_KEY not found - GPT-5.1 features will be unavailable
⚠️  GEMINI_API_KEY not found - Gemini fallback will be unavailable
```

**Network Tab (Expected Failed Requests):**
- POST /api/ai/analyze - 500 (AI health check failed)
- POST /api/ai/chat - 500 (AI health check failed)
- GET /api/ai/health - 500 (AI health check failed)

**Browser Console (Acceptable Errors):**
- "Failed to fetch insights" - Expected when API keys missing
- "Failed to send chat message" - Expected when API keys missing

---

## Reporting Issues

If you find any failures:

1. **Take screenshots** of the failure
2. **Copy console errors** (entire stack trace)
3. **Note reproduction steps** (what you clicked, what happened)
4. **Document** in Phase 1 results file

---

## Success Criteria for Phase 1

Phase 1 is considered **PASSED** if:

- ✅ Modal opens without crash (TC1.3)
- ✅ Insights error handling works (TC1.4)
- ✅ Chat error handling works (TC1.5)
- ✅ No unexpected JavaScript errors
- ✅ UI remains functional after errors
- ✅ No data loss or state corruption

Phase 1 can have **WARNINGS** for:
- ⚠️ AIService health check returns 500 (known issue, already documented)
- ⚠️ Error messages could be more user-friendly
- ⚠️ Missing API keys warnings in backend console

---

## Next Steps After Phase 1

Once Phase 1 is complete:

1. **Update** docs/testing/epic-7-phase-1-results.md with TC1.3-TC1.5 results
2. **Obtain API Keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://aistudio.google.com/app/apikey
3. **Add to .env:**
   ```
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=...
   ```
4. **Restart backend** to load new keys
5. **Run Phase 2 tests** (14 integration tests with live AI)

---

**Test Session Start Time:** _____________
**Test Session End Time:** _____________
**Total Duration:** _____________
**Tester Signature:** _____________

---

**Good luck with testing! 🧪**
