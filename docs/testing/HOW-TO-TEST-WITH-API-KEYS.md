# How to Test Epic 7 with API Keys

**Goal:** Get AI features working so you can test insights and chat functionality
**Time:** 15-20 minutes total

---

## Step 1: Get Free API Keys (10 minutes)

### Option A: OpenAI (GPT-4) - Recommended First

**Why:** Higher quality responses, faster, better for testing
**Free Credits:** $5 free (enough for ~1000 AI insights)
**Cost After Free:** ~$0.01 per insight (very cheap)

#### Get OpenAI API Key:

1. **Sign Up**
   - Go to: https://platform.openai.com/signup
   - Use your email or Google account
   - Verify your email

2. **Get API Key**
   - Go to: https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it: "Smart Budget Testing"
   - **IMPORTANT:** Copy the key immediately (starts with `sk-proj-...`)
   - You won't be able to see it again!

3. **Save It**
   ```
   sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Note:** You get $5 in free credits for 3 months. After that, you pay only for what you use.

---

### Option B: Google Gemini (Fallback) - Also Good

**Why:** Completely free, generous limits
**Free Tier:** 60 requests per minute (unlimited!)
**Cost:** Free forever for moderate use

#### Get Gemini API Key:

1. **Sign Up**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" (or use existing)
   - **IMPORTANT:** Copy the key immediately (starts with `AIza...`)

3. **Save It**
   ```
   AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Note:** Gemini is completely free with generous limits. Perfect for testing!

---

## Step 2: Add API Keys to Your .env File (2 minutes)

1. **Open your backend .env file**
   ```bash
   # Location: D:\smart budget\Smart-Budget-App\backend\.env
   ```

2. **Add these lines at the end:**
   ```env
   # ================================================
   # AI Configuration (OpenAI GPT & Google Gemini)
   # ================================================
   OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
   GEMINI_API_KEY=AIzaYOUR_ACTUAL_KEY_HERE
   ```

3. **Replace with your actual keys:**
   ```env
   OPENAI_API_KEY=sk-proj-abc123def456...
   GEMINI_API_KEY=AIzaXYZ789...
   ```

**Example .env file (bottom section):**
```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=sk-proj-123
GEMINI_API_KEY=123
```

---

## Step 3: Restart Backend (30 seconds)

The backend needs to be restarted to load the new API keys.

**In your terminal where backend is running:**

1. **Stop the backend**
   - Press `Ctrl + C`

2. **Start it again**
   ```bash
   npm run dev
   ```

3. **Look for success messages:**
   ```
   ✅ OpenAI API key configured
   ✅ Gemini API key configured
   🚀 Backend server running on http://localhost:5000
   ```

**If you see warnings like:**
```
⚠️  OPENAI_API_KEY not found
⚠️  GEMINI_API_KEY not found
```
→ Go back to Step 2, check your .env file has the keys!

---

## Step 4: Verify API Keys Work (1 minute)

Test that the backend can connect to AI providers:

```bash
curl http://localhost:5000/api/ai/health
```

**Expected Response:**
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

**✅ If both are `true` → You're ready to test!**

**❌ If `false`:**
- Check the API key is correct (no extra spaces)
- Check the key format (OpenAI starts with `sk-proj-`, Gemini starts with `AIza`)
- Restart backend again

---

## Step 5: Create Test User (1 minute)

You need a user account to test the AI features.

**Connect to your database and run:**

```sql
INSERT INTO users (email, password_hash, subscription_tier, created_at)
VALUES ('test@example.com', '$2b$10$RVAWkT5tmSAEF8FlAchtUew4ERR4uzLIkoJsfgHvauJiqTC6FHM1S', 'free', NOW())
ON CONFLICT (email) DO NOTHING;
```

**Test Credentials:**
- **Email:** test@example.com
- **Password:** TestPass123!
- **Tier:** Free (5 AI insights per day, uses Gemini)

---

## Step 6: Test AI Features! (5 minutes)

### Test 1: Generate AI Insights

1. **Open browser:** http://localhost:3000
2. **Login:** test@example.com / TestPass123!
3. **Navigate to:** Transactions page
4. **Click:** "Get AI Insights" button
5. **Click:** "Generate Analysis"

**Expected:**
- Loading animation appears (skeleton + spinner)
- After 5-10 seconds, insights appear:
  - 📊 Financial summary (income, expenses, balance)
  - 📈 Spending analysis
  - 💡 Recommendations
- Footer shows: "Powered by Gemini Pro" (free tier uses Gemini)
- Quota shows: "4/5 insights remaining"

**✅ If this works → AI integration successful!**

---

### Test 2: Chat with AI

1. **In the modal, click:** "💬 Chat" tab
2. **Click quick prompt:** "How can I save more?"
3. **Wait for response**

**Expected:**
- Bouncing dots animation
- Response appears in 5-10 seconds
- Personalized advice based on your transactions
- Quota decreases: "3/5 insights remaining"

**✅ If this works → Chat integration successful!**

---

### Test 3: Deep Thinking Mode

1. **Enable checkbox:** "Deep thinking"
2. **Type:** "Should I adjust my budget based on my spending?"
3. **Send message**

**Expected:**
- Takes a bit longer (~10-15 seconds)
- More detailed, thoughtful response
- Still uses Gemini (free tier)

---

### Test 4: Test Quota Limits

1. **Generate insights** 4 more times (total 5)
2. **On 6th attempt:**

**Expected:**
- Error toast appears
- Message: "Daily limit reached. You've used all 5 AI insights for today."
- Suggests upgrading to Basic or Pro

**✅ Quota tracking working!**

---

### Test 5: Upgrade to Basic Tier (Uses GPT-4)

Want to test with OpenAI GPT-4 instead of Gemini?

**Run SQL:**
```sql
UPDATE users
SET subscription_tier = 'basic'
WHERE email = 'test@example.com';
```

**Then:**
1. Logout and login again
2. Generate insights

**Expected:**
- Faster responses (~2-5 seconds)
- Higher quality insights
- Footer shows: "Powered by GPT-4 Turbo"
- Quota: "49/50 insights remaining"

---

## Troubleshooting

### Issue: "AI health check failed"

**Cause:** API keys not loaded or invalid

**Fix:**
1. Check .env file has the keys (no typos)
2. Restart backend
3. Test health endpoint again

---

### Issue: "Quota exceeded" immediately

**Cause:** You already used quota today

**Fix:**
```sql
-- Reset quota for test user
DELETE FROM user_requests
WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

---

### Issue: "No transactions found"

**Cause:** User has no transactions in database

**Fix:**
```sql
-- Add sample transactions
INSERT INTO transactions (user_id, type, amount, category, date, description)
SELECT
  (SELECT id FROM users WHERE email = 'test@example.com'),
  'expense',
  150.50,
  'Food & Dining',
  CURRENT_DATE - 5,
  'Grocery shopping'
UNION ALL
SELECT
  (SELECT id FROM users WHERE email = 'test@example.com'),
  'income',
  2500.00,
  'Salary',
  CURRENT_DATE - 1,
  'Monthly salary';
```

---

### Issue: Slow responses (>30 seconds)

**Cause:** Network issues or API rate limiting

**Fix:**
- Check internet connection
- Wait a minute and try again
- Gemini has 60 req/min limit (should be fine)
- OpenAI has higher limits

---

## Cost Monitoring

### OpenAI Costs
- View usage: https://platform.openai.com/usage
- Each insight costs ~$0.01 (very cheap)
- $5 free credits = ~500 insights
- Set budget limits in OpenAI dashboard

### Gemini Costs
- Completely free for moderate use
- 60 requests per minute
- No credit card required

---

## Next Steps

Once AI features are working:

✅ **Run full Phase 2 tests:**
- See: `docs/testing/epic-7-testing-plan.md` (Phase 2 section)
- 14 test cases covering all scenarios
- ~30 minutes to complete

✅ **Test all subscription tiers:**
- Free tier (Gemini, 5/day)
- Basic tier (GPT-4 Turbo, 50/day)
- Pro tier (GPT-4, unlimited)

✅ **Test edge cases:**
- No transactions
- Date range filtering
- 10 message conversation limit
- Quota reset after 24 hours

---

## Quick Reference

**API Key URLs:**
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://aistudio.google.com/app/apikey

**Test Credentials:**
- Email: test@example.com
- Password: TestPass123!

**Health Check:**
```bash
curl http://localhost:5000/api/ai/health
```

**Reset Quota:**
```sql
DELETE FROM user_requests WHERE user_id = (SELECT id FROM users WHERE email = 'test@example.com');
```

**Upgrade Tier:**
```sql
UPDATE users SET subscription_tier = 'basic' WHERE email = 'test@example.com';
-- or 'pro' for unlimited
```

---

**Ready to test? Start with Step 1 and get those API keys!** 🚀
