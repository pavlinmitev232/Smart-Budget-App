# Smart-Budget-App - Phase 2 Epic Breakdown

**Author:** pavlin (Business Analyst: Mary)
**Date:** 2025-11-25
**Project Level:** Level 2 (BMad Method)
**Target Scale:** 7 Epics, ~25-28 Stories
**AI Stack:** GPT-5.1 (Primary), Gemini 3.0 Pro (Fallback)

---

## Overview

This document provides the complete epic and story breakdown for Smart-Budget-App Phase 2, building upon the completed MVP (Epics 1-5) with advanced features including AI-powered insights, subscription tiers, goal tracking, and bill comparison.

This breakdown organizes Phase 2 development into 7 value-driven epics:

1. **Subscription Tier System** - Monetization and feature gating foundation
2. **Password Recovery** - Essential account security feature
3. **Public Landing Page** - Marketing presence and lead generation
4. **AI Financial Advisor** - GPT-5.1 powered transaction insights and chat
5. **Income Profile Management** - Salary tracking for AI budget optimization
6. **Financial Goal Tracking** - Savings goals with progress visualization
7. **AI Bill Comparison** - GPT-5.1 vision-powered receipt comparison

Each epic delivers independent value and maintains the system in a deployable state.

---

## Phase 2 Implementation Sequence

### **Phase 2A: Foundation & Infrastructure** (Weeks 1-2)
1. Epic 10 - Subscription Tiers ⭐ (Foundation for AI features)
2. Epic 11 - Password Recovery (Quick win, essential UX)
3. Epic 6 - Landing Page (Marketing presence)

### **Phase 2B: AI Features** (Weeks 3-5)
4. Epic 7 - AI Financial Advisor ⭐ (Core differentiator)
5. Epic 8 - Income Profile Management (Enhances AI context)

### **Phase 2C: Advanced Features** (Weeks 6-8)
6. Epic 9 - Goal Tracking (Builds on income data)
7. Epic 12 - Bill Comparison (Unique advanced feature)

---

## Epic 10: Subscription Tier System

**Goal:** Implement Free/Basic/Pro subscription tiers with AI request limiting and feature gating to enable monetization and resource management.

**Value:** Establishes the business model foundation and controls AI API costs through request quotas. Enables premium features for paying users while maintaining a free tier.

**Scope:** User subscription tier management, request quota tracking, feature gating middleware, tier-based access control, subscription management UI.

**Dependencies:** None (foundational for Epics 7, 8, 9, 12)

**Technical Notes:**
- Extend `users` table with `subscription_tier` enum field
- Create `user_requests` table for quota tracking
- Implement middleware for tier-based feature access
- Rolling 24-hour quota window
- Payment integration is placeholder for future (Stripe/PayPal)

---

### Story 10.1: Add Subscription Schema and Tier Definitions

As a developer,
I want to extend the database schema with subscription tier support,
So that users can be assigned different subscription levels with associated features.

**Acceptance Criteria:**

**Given** the existing users table structure
**When** I run the new migration
**Then** the database is updated with subscription support

**And** the `users` table includes new field:
- `subscription_tier` (VARCHAR(20), DEFAULT 'free', CHECK IN ('free', 'basic', 'pro'))

**And** a new `user_requests` table is created:
```sql
CREATE TABLE user_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL, -- 'ai_insight', 'bill_comparison', etc.
  request_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  provider VARCHAR(50), -- 'gpt-5.1', 'gemini-3-pro'
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_user_requests_user_time ON user_requests(user_id, request_timestamp DESC);
```

**And** tier definitions are documented in code:
```typescript
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: {
      aiInsightsPerDay: 5,
      billComparisonsPerDay: 1,
      maxGoals: 3,
      transactionHistoryMonths: 6,
      exportData: false,
      aiProvider: 'gemini-3-pro'
    }
  },
  basic: {
    name: 'Basic',
    price: 10, // USD per month
    features: {
      aiInsightsPerDay: 50,
      billComparisonsPerDay: 10,
      maxGoals: 10,
      transactionHistoryMonths: 24,
      exportData: true, // CSV only
      aiProvider: 'gpt-5.1'
    }
  },
  pro: {
    name: 'Pro',
    price: 30, // USD per month
    features: {
      aiInsightsPerDay: -1, // Unlimited
      billComparisonsPerDay: -1, // Unlimited
      maxGoals: -1, // Unlimited
      transactionHistoryMonths: -1, // Unlimited
      exportData: true, // CSV + PDF
      aiProvider: 'gpt-5.1',
      prioritySupport: true
    }
  }
} as const;
```

**And** migration includes rollback capability

**Prerequisites:** Story 1.3 (users table exists)

**Technical Notes:**
- Use node-pg-migrate for migration
- Default all existing users to 'free' tier
- Add database constraint for valid tier values
- Store tier configuration in `backend/src/config/subscriptions.ts`
- Consider adding `subscription_start_date` and `subscription_end_date` for future billing

---

### Story 10.2: Build Request Quota Tracking System

As a system administrator,
I want to track user AI requests in a rolling 24-hour window,
So that tier-based rate limits are enforced accurately.

**Acceptance Criteria:**

**Given** a user with a specific subscription tier
**When** they make an AI request (insight or bill comparison)
**Then** the request is logged and quota is checked

**And** the backend includes request tracking service:
```typescript
// backend/src/features/subscriptions/quota.service.ts

export class QuotaService {
  /**
   * Check if user has available quota for request type
   */
  async checkQuota(userId: number, requestType: 'ai_insight' | 'bill_comparison'): Promise<QuotaCheckResult> {
    const user = await getUserWithTier(userId);
    const tierLimits = SUBSCRIPTION_TIERS[user.subscriptionTier].features;

    // Get limit for request type
    const dailyLimit = requestType === 'ai_insight'
      ? tierLimits.aiInsightsPerDay
      : tierLimits.billComparisonsPerDay;

    // Unlimited for pro tier
    if (dailyLimit === -1) {
      return { allowed: true, remaining: -1, resetAt: null };
    }

    // Count requests in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const requestCount = await db.query(`
      SELECT COUNT(*) FROM user_requests
      WHERE user_id = $1
        AND request_type = $2
        AND request_timestamp > $3
    `, [userId, requestType, twentyFourHoursAgo]);

    const count = parseInt(requestCount.rows[0].count);
    const remaining = dailyLimit - count;

    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      resetAt: this.getOldestRequestTimestamp(userId, requestType)
    };
  }

  /**
   * Log a request after successful completion
   */
  async logRequest(userId: number, requestType: string, provider: string, tokensUsed: number) {
    await db.query(`
      INSERT INTO user_requests (user_id, request_type, provider, tokens_used)
      VALUES ($1, $2, $3, $4)
    `, [userId, requestType, provider, tokensUsed]);
  }

  /**
   * Get quota status for user (for UI display)
   */
  async getQuotaStatus(userId: number): Promise<QuotaStatus> {
    const user = await getUserWithTier(userId);
    const aiQuota = await this.checkQuota(userId, 'ai_insight');
    const billQuota = await this.checkQuota(userId, 'bill_comparison');

    return {
      tier: user.subscriptionTier,
      aiInsights: aiQuota,
      billComparisons: billQuota
    };
  }
}
```

**And** quota exceeded returns standardized error:
```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Daily AI insight limit reached (5/5). Upgrade to Basic for 50/day or Pro for unlimited.",
    "quotaStatus": {
      "used": 5,
      "limit": 5,
      "resetAt": "2025-11-26T10:30:00Z"
    }
  }
}
```

**And** successful requests include quota info in response:
```json
{
  "success": true,
  "data": { ... },
  "quotaStatus": {
    "remaining": 4,
    "limit": 5,
    "resetAt": "2025-11-26T10:30:00Z"
  }
}
```

**Prerequisites:** Story 10.1 (subscription schema exists)

**Technical Notes:**
- Use 24-hour rolling window (not calendar day)
- Reset time = timestamp of oldest request + 24 hours
- Clean up old requests (>30 days) with scheduled job
- Cache quota checks for 1 minute to reduce DB load
- Consider Redis for high-traffic quota tracking (future optimization)

---

### Story 10.3: Implement Feature Gating Middleware

As a developer,
I want reusable middleware to protect tier-gated features,
So that only authorized users can access premium functionality.

**Acceptance Criteria:**

**Given** API endpoints that require specific subscription tiers
**When** a request is made to a protected endpoint
**Then** the middleware validates the user's tier and quota

**And** feature gating middleware is implemented:
```typescript
// backend/src/middleware/featureGate.ts

/**
 * Middleware to enforce subscription tier requirements
 */
export const requireTier = (minTier: 'free' | 'basic' | 'pro') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = await getUserWithTier(req.user.userId);

    const tierHierarchy = { free: 0, basic: 1, pro: 2 };

    if (tierHierarchy[user.subscriptionTier] < tierHierarchy[minTier]) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_TIER',
          message: `This feature requires ${minTier} tier or higher. Current tier: ${user.subscriptionTier}`,
          upgradeTo: minTier
        }
      });
    }

    req.user.subscriptionTier = user.subscriptionTier;
    next();
  };
};

/**
 * Middleware to check and enforce quota limits
 */
export const checkQuota = (requestType: 'ai_insight' | 'bill_comparison') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const quotaService = new QuotaService();
    const quotaCheck = await quotaService.checkQuota(req.user.userId, requestType);

    if (!quotaCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: `Daily ${requestType} limit reached. Upgrade for higher limits.`,
          quotaStatus: quotaCheck
        }
      });
    }

    // Store quota info in request for post-request logging
    req.quotaCheck = quotaCheck;
    next();
  };
};

/**
 * Combined middleware for protected AI endpoints
 */
export const protectAIEndpoint = (requestType: 'ai_insight' | 'bill_comparison') => {
  return [
    authenticateToken, // From Epic 2
    checkQuota(requestType)
  ];
};
```

**And** endpoints use middleware:
```typescript
// backend/src/features/ai/ai.routes.ts

router.post('/api/ai/analyze',
  protectAIEndpoint('ai_insight'),
  aiController.analyzeTransactions
);

router.post('/api/ai/compare-bills',
  protectAIEndpoint('bill_comparison'),
  aiController.compareBills
);

// Export feature requires Basic tier
router.get('/api/transactions/export',
  authenticateToken,
  requireTier('basic'),
  transactionController.exportTransactions
);
```

**And** middleware logs successful requests:
```typescript
// In controller after successful AI response
await quotaService.logRequest(
  req.user.userId,
  'ai_insight',
  'gpt-5.1',
  response.usage.total_tokens
);
```

**Prerequisites:** Story 10.2 (quota service exists), Story 2.3 (auth middleware exists)

**Technical Notes:**
- Middleware must come after `authenticateToken` (requires req.user)
- Return 403 for tier insufficient, 429 for quota exceeded
- Include upgrade suggestion in error messages
- Log all quota violations for analytics
- Consider adding feature flags for gradual rollout

---

### Story 10.4: Create Subscription Management UI

As a user,
I want to view my current subscription tier and usage stats,
So that I understand my limits and can upgrade if needed.

**Acceptance Criteria:**

**Given** I am logged into the application
**When** I navigate to Settings/Account
**Then** I see my subscription information

**And** the Subscription page displays:
- **Current Tier:** Badge showing "Free", "Basic ($10/mo)", or "Pro ($30/mo)"
- **Usage Stats:**
  - AI Insights: "4/5 used today" (progress bar)
  - Bill Comparisons: "0/1 used today" (progress bar)
  - Goals: "2/3 active goals"
  - Transaction History: "6 months retention"
- **Tier Comparison Table:**

| Feature | Free (Current) | Basic | Pro |
|---------|----------------|-------|-----|
| AI Insights | 5/day | 50/day | Unlimited |
| Bill Comparisons | 1/day | 10/day | Unlimited |
| Goals | 3 max | 10 max | Unlimited |
| History | 6 months | 2 years | Unlimited |
| Export | ❌ | ✅ CSV | ✅ CSV+PDF |
| Price | $0 | $10/mo | $30/mo |

**And** each tier has an action button:
- Free tier: "Current Plan" (disabled)
- Basic tier: "Upgrade to Basic" (placeholder)
- Pro tier: "Upgrade to Pro" (placeholder)

**And** clicking upgrade button shows modal:
```
"Payment Integration Coming Soon!"

We're working on enabling paid subscriptions.
Join our waitlist to be notified when upgrades are available.

[Email input field]
[Join Waitlist] [Cancel]
```

**And** API endpoint exists:
```typescript
GET /api/user/subscription
Response:
{
  "success": true,
  "data": {
    "tier": "free",
    "quotaStatus": {
      "aiInsights": { "used": 4, "limit": 5, "remaining": 1, "resetAt": "..." },
      "billComparisons": { "used": 0, "limit": 1, "remaining": 1, "resetAt": "..." }
    },
    "features": { ... }, // Tier feature limits
    "canUpgrade": true
  }
}
```

**And** quota status updates in real-time after AI requests

**And** responsive design:
- Desktop: Comparison table with all columns
- Mobile: Stacked cards for each tier

**Prerequisites:** Story 10.2 (quota service), Story 10.3 (feature gating), Story 2.6 (settings page structure)

**Technical Notes:**
- Use React Context for subscription state
- Refresh quota status after each AI request
- Progress bars with color coding (green < 80%, yellow 80-100%, red = limit reached)
- Store waitlist emails in `subscription_waitlist` table (optional)
- Future: Replace placeholder with Stripe Checkout integration
- Show upgrade prompts when hitting quota limits (toast notification)

---

## Epic 11: Password Recovery & Account Security

**Goal:** Enable users to securely reset forgotten passwords via email verification, preventing account lockout and reducing support burden.

**Value:** Essential user experience feature that builds trust and reduces friction. Prevents user frustration from forgotten passwords.

**Scope:** Forgot password flow, secure token generation, email delivery, reset password form, token validation and expiration.

**Dependencies:** Email service (Nodemailer - simplest for MVP)

**Technical Notes:**
- Use JWT tokens for password reset (signed, 1-hour expiration)
- Store reset tokens in `password_reset_tokens` table
- Send emails via Nodemailer with Gmail SMTP
- Secure reset links: `/reset-password?token=<JWT>`
- One token per user (invalidate previous on new request)

---

### Story 11.1: Build Forgot Password API with Token Generation

As a user who forgot my password,
I want to request a password reset link via email,
So that I can regain access to my account securely.

**Acceptance Criteria:**

**Given** I have registered an account but forgot my password
**When** I submit my email to the forgot password endpoint
**Then** a secure reset token is generated and emailed to me

**And** the database includes `password_reset_tokens` table:
```sql
CREATE TABLE password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
```

**And** the endpoint `/api/auth/forgot-password` accepts:
```json
{
  "email": "user@example.com"
}
```

**And** the backend validates:
- Email format is valid
- Email exists in users table (but doesn't reveal if email not found - security)

**And** password reset token is generated:
```typescript
// backend/src/features/auth/auth.service.ts

async requestPasswordReset(email: string): Promise<void> {
  const user = await db.query(
    'SELECT id, email FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  // Always return success to prevent email enumeration
  if (user.rows.length === 0) {
    console.log(`Password reset requested for non-existent email: ${email}`);
    return;
  }

  const userId = user.rows[0].id;

  // Generate JWT token (1 hour expiration)
  const resetToken = jwt.sign(
    { userId, email, type: 'password_reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  // Calculate expiration timestamp
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing reset tokens for this user
  await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

  // Store new token
  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, resetToken, expiresAt]
  );

  // Send email (Story 11.2)
  await emailService.sendPasswordResetEmail(email, resetToken);

  console.log(`Password reset token generated for user ${userId}`);
}
```

**And** successful response (always returns 200, even if email not found):
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**And** token is a signed JWT with payload:
```json
{
  "userId": 123,
  "email": "user@example.com",
  "type": "password_reset",
  "iat": 1700000000,
  "exp": 1700003600
}
```

**And** only one active reset token per user (new request invalidates old token)

**And** tokens are deleted after successful password reset

**Prerequisites:** Story 2.1 (users table exists), Story 1.4 (JWT_SECRET configured)

**Technical Notes:**
- Always return success (don't reveal if email exists - security best practice)
- Use same JWT_SECRET as authentication
- Token includes userId to avoid DB lookup on validation
- Clean up expired tokens with scheduled job (daily)
- Log all password reset requests for security monitoring
- Rate limit: max 3 requests per email per hour (prevent spam)

---

### Story 11.2: Implement Email Delivery with Reset Link

As a system,
I want to send password reset emails with secure links,
So that users can complete the password reset flow.

**Acceptance Criteria:**

**Given** a password reset token has been generated
**When** the email service is triggered
**Then** a password reset email is sent to the user

**And** Nodemailer is configured with Gmail SMTP:
```typescript
// backend/src/services/email.service.ts

import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL, // your-app@gmail.com
        pass: process.env.SMTP_PASSWORD // App-specific password
      }
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Smart Budget App" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password for your Smart Budget App account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email. Your password won't be changed.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">Smart Budget App - Your Personal Finance Manager</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
```

**And** environment variables are configured:
```bash
# backend/.env
SMTP_EMAIL=your-app@gmail.com
SMTP_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000
```

**And** email includes:
- Clear subject line: "Password Reset Request"
- Explanation of why they received the email
- Prominent reset button with link
- Plain text link as fallback
- Expiration warning (1 hour)
- Security note: "If you didn't request this, ignore it"
- Sender: "Smart Budget App" with from address

**And** email delivery errors are logged but don't expose to user

**And** reset link format: `http://localhost:3000/reset-password?token=<JWT>`

**Prerequisites:** Story 11.1 (token generation)

**Technical Notes:**
- Use Gmail App-Specific Password (not regular password)
- Enable "Less secure app access" in Gmail (or use OAuth2 for production)
- Consider using SendGrid or AWS SES for production (more reliable)
- Test email delivery in development with tools like Mailtrap
- Add HTML email template with inline CSS for better compatibility
- Consider text-only email version for accessibility
- Future: Use email templates from files instead of inline strings

---

### Story 11.3: Create Reset Password Form and Validation

As a user,
I want to submit a new password via the reset link,
So that I can regain access to my account with a new password.

**Acceptance Criteria:**

**Given** I received a password reset email
**When** I click the reset link
**Then** I am taken to a password reset form

**And** the frontend route exists: `/reset-password?token=<JWT>`

**And** the ResetPassword component:
- Extracts token from URL query parameter
- Validates token format (JWT structure)
- Shows form if token valid
- Shows error if token invalid/expired

**And** the reset password form includes:
- New password input (type="password")
- Confirm password input (type="password")
- Show/hide password toggle
- Submit button: "Reset Password"
- Password requirements displayed:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character

**And** frontend validation:
- Passwords match
- Password meets requirements
- Token exists in URL

**And** the endpoint `/api/auth/reset-password` accepts:
```json
{
  "token": "<JWT_TOKEN>",
  "newPassword": "NewSecurePass123!"
}
```

**And** the backend validates:
- Token is valid JWT
- Token signature is correct
- Token is not expired
- Token exists in `password_reset_tokens` table
- Token has not been used
- New password meets requirements

**And** password reset logic:
```typescript
// backend/src/features/auth/auth.service.ts

async resetPassword(token: string, newPassword: string): Promise<void> {
  // Verify JWT token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as ResetTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }

  // Check token exists in database and is not expired
  const tokenRecord = await db.query(
    'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1',
    [token]
  );

  if (tokenRecord.rows.length === 0) {
    throw new Error('Reset token not found or already used');
  }

  const { user_id, expires_at } = tokenRecord.rows[0];

  if (new Date() > new Date(expires_at)) {
    // Delete expired token
    await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
    throw new Error('Reset token has expired');
  }

  // Validate new password
  if (!this.validatePassword(newPassword)) {
    throw new Error('Password does not meet requirements');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  await db.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, user_id]
  );

  // Delete used reset token
  await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

  console.log(`Password successfully reset for user ${user_id}`);
}
```

**And** successful response:
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

**And** error responses:
- 400: "Invalid or expired reset token"
- 400: "Password does not meet requirements"
- 400: "Reset token not found or already used"

**And** after successful reset:
- User is redirected to login page
- Success toast: "Password reset successful! Please log in."
- Old password no longer works
- Reset token is deleted (cannot be reused)

**And** invalid/expired token shows error page:
```
Reset Link Invalid or Expired

This password reset link is no longer valid. It may have expired or already been used.

[Request New Reset Link]
```

**Prerequisites:** Story 11.1 (token generation), Story 11.2 (email delivery), Story 2.1 (password hashing)

**Technical Notes:**
- Use React Hook Form for form validation
- Show password strength indicator
- Client-side validation before API call
- Secure token transmission (HTTPS in production)
- Log successful password resets for security
- Consider adding "Sign in" link on success page
- Future enhancement: Force logout all sessions after password reset
- Consider rate limiting reset attempts (prevent brute force)

---

## Epic 6: Public Landing Page & Lead Generation

**Goal:** Create a professional, engaging landing page with scroll animations and contact form to attract visitors and capture leads before they sign up.

**Value:** Establishes marketing presence, showcases app features, and provides a polished first impression. Captures lead information for future marketing campaigns.

**Scope:** Public homepage route, hero section, features showcase, scroll-triggered animations, contact form, email delivery, SEO optimization.

**Dependencies:** None (independent public feature)

**Technical Notes:**
- Public route: `/` (redirects to `/dashboard` if logged in)
- Animation library: Framer Motion (React-native API)
- Email service: Reuse Nodemailer from Epic 11
- Responsive design: Mobile-first approach
- Contact submissions stored in `contact_submissions` table

---

### Story 6.1: Build Landing Page Structure and Layout

As a visitor,
I want to see an engaging landing page when I visit the app,
So that I understand the value proposition and features before signing up.

**Acceptance Criteria:**

**Given** I visit the application root URL
**When** I am not logged in
**Then** I see the public landing page

**And** the landing page includes sections:

1. **Hero Section:**
   - App logo and name: "Smart Budget App"
   - Tagline: "Transform Your Finances with AI-Powered Insights"
   - Subtitle: "Track expenses, analyze spending, and achieve your financial goals with intelligent recommendations"
   - Primary CTA button: "Get Started Free"
   - Secondary CTA: "See How It Works" (scroll to features)
   - Hero image/illustration (financial dashboard preview)

2. **Features Section:**
   - Section heading: "Everything You Need to Master Your Finances"
   - 6 feature cards in grid layout (2x3 on desktop, 1 column on mobile):
     - **Transaction Tracking:** "Easily log income and expenses with smart categorization"
     - **Visual Analytics:** "Beautiful charts and graphs that make your data crystal clear"
     - **AI Financial Advisor:** "Get personalized insights and recommendations powered by GPT-5.1"
     - **Goal Tracking:** "Set financial goals and watch your progress in real-time"
     - **Bill Comparison:** "Compare receipts with AI to find the best deals and track price changes"
     - **Smart Budgeting:** "AI-powered budget optimization based on your income and spending patterns"
   - Each card: Icon, title, description

3. **How It Works Section:**
   - Section heading: "Get Started in 3 Simple Steps"
   - 3 step cards:
     - **1. Create Account:** "Sign up free in seconds - no credit card required"
     - **2. Add Transactions:** "Manually log or import your financial data"
     - **3. Get Insights:** "Let AI analyze your spending and suggest improvements"

4. **Pricing Preview Section:**
   - Section heading: "Choose Your Plan"
   - 3 pricing cards (Free, Basic $10/mo, Pro $30/mo)
   - Basic comparison of tier features
   - CTA: "Start with Free Plan"

5. **Contact/CTA Section:**
   - Heading: "Ready to Take Control of Your Finances?"
   - Contact form (Story 6.3)
   - Final CTA: "Sign Up Now"

6. **Footer:**
   - Copyright: "© 2025 Smart Budget App"
   - Links: About, Privacy Policy (placeholder), Terms (placeholder)
   - Social media icons (placeholder)

**And** navigation bar includes:
- Logo (links to top)
- Links: Features, How It Works, Pricing, Contact
- Buttons: "Log In" | "Sign Up"

**And** routing logic:
```typescript
// If user is logged in, redirect to dashboard
if (isAuthenticated) {
  navigate('/dashboard');
}
```

**And** responsive design:
- Desktop: Multi-column layouts, side-by-side sections
- Tablet: 2-column grids
- Mobile: Single column, stacked sections

**And** styling with Tailwind CSS:
- Consistent color scheme (use existing app colors)
- Modern, clean design
- Readable typography
- Sufficient white space

**Prerequisites:** None (new public route)

**Technical Notes:**
- Create new route: `/` handled by `<LandingPage />` component
- Use React Router for navigation between sections
- Smooth scroll behavior for anchor links
- Lazy load images for performance
- Use semantic HTML5 tags (<header>, <section>, <footer>)
- Add meta tags for SEO (Story 6.4)
- Consider using a landing page template/library (optional)

---

### Story 6.2: Implement Scroll-Triggered Animations

As a visitor,
I want to see smooth animations as I scroll through the landing page,
So that the experience feels modern and engaging.

**Acceptance Criteria:**

**Given** I am viewing the landing page
**When** I scroll down the page
**Then** sections and elements animate into view

**And** Framer Motion is integrated:
```bash
npm install framer-motion
```

**And** animation patterns implemented:

1. **Fade In on Scroll:**
   - Feature cards fade in as they enter viewport
   - Staggered animation (cards appear one after another)

2. **Slide Up on Scroll:**
   - Section headings slide up from below
   - Text content slides up with delay

3. **Scale on Scroll:**
   - Images/icons scale from 0.8 to 1.0
   - Smooth easing

4. **Hero Section Animations (on load):**
   - Heading fades in from top
   - Subtext fades in with delay
   - CTA buttons slide up with bounce effect

**And** example implementation:
```typescript
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';

// Fade in on scroll
const FadeInSection = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

// Staggered children animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2 // Each child delayed by 0.2s
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Feature cards with stagger
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate={isInView ? "visible" : "hidden"}
  className="grid grid-cols-3 gap-6"
>
  {features.map(feature => (
    <motion.div key={feature.id} variants={itemVariants}>
      <FeatureCard {...feature} />
    </motion.div>
  ))}
</motion.div>
```

**And** animations are:
- Smooth and not jarring (0.4-0.8s duration)
- Triggered once (not on every scroll)
- Respect `prefers-reduced-motion` accessibility setting
- Performance optimized (use `transform` and `opacity` only)

**And** specific animations by section:
- **Hero:** Fade in on load
- **Features:** Staggered fade + slide up
- **How It Works:** Slide from left (step 1), center (step 2), right (step 3)
- **Pricing:** Scale up on scroll
- **Contact:** Fade in

**And** mobile animations:
- Simplified animations (fewer effects)
- Faster animation duration (0.3-0.5s)
- Less vertical offset to avoid layout shift

**Prerequisites:** Story 6.1 (landing page structure exists)

**Technical Notes:**
- Use `useInView` hook to detect when elements enter viewport
- Set `once: true` to prevent re-triggering on scroll up
- Use `margin: "-100px"` to trigger animations slightly before element is fully visible
- Avoid animating too many properties (impacts performance)
- Test on lower-end devices for smooth 60fps animations
- Consider using `will-change` CSS property sparingly
- Future: Add parallax effect on hero background (optional)

---

### Story 6.3: Build Contact Form with Email Delivery

As a visitor,
I want to submit a contact/inquiry message,
So that I can reach out with questions or feedback.

**Acceptance Criteria:**

**Given** I am on the landing page Contact section
**When** I fill out and submit the contact form
**Then** my message is sent to the app owner's email

**And** the contact form includes:
- Name input (required, text)
- Email input (required, email validation)
- Subject dropdown (optional): "General Inquiry", "Feature Request", "Bug Report", "Partnership", "Other"
- Message textarea (required, 500 char max)
- Submit button: "Send Message"
- Success message area
- reCAPTCHA (optional - to prevent spam)

**And** frontend validation:
- Name: Min 2 characters, max 100
- Email: Valid email format
- Message: Min 10 characters, max 500

**And** the endpoint `/api/contact` accepts:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Feature Request",
  "message": "I would love to see a mobile app version..."
}
```

**And** contact submissions are stored in database:
```sql
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  message TEXT NOT NULL,
  ip_address VARCHAR(45), -- For spam prevention
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_contact_email ON contact_submissions(email);
CREATE INDEX idx_contact_created ON contact_submissions(created_at DESC);
```

**And** email is sent to app owner:
```typescript
// backend/src/features/contact/contact.service.ts

async submitContactForm(data: ContactFormData, req: Request): Promise<void> {
  // Store in database
  await db.query(`
    INSERT INTO contact_submissions (name, email, subject, message, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    data.name,
    data.email,
    data.subject || 'General Inquiry',
    data.message,
    req.ip,
    req.get('user-agent')
  ]);

  // Send email notification to owner
  await emailService.sendContactNotification({
    from: data.email,
    name: data.name,
    subject: data.subject,
    message: data.message
  });

  // Send confirmation email to submitter
  await emailService.sendContactConfirmation(data.email, data.name);
}
```

**And** email to app owner:
```
Subject: [Smart Budget App] New Contact Form Submission

New contact form submission:

Name: John Doe
Email: john@example.com
Subject: Feature Request

Message:
I would love to see a mobile app version...

---
Submitted: 2025-11-25 10:30 AM
IP: 192.168.1.1
```

**And** confirmation email to submitter:
```
Subject: Thanks for Contacting Smart Budget App

Hi John,

Thank you for reaching out! We've received your message and will get back to you within 24-48 hours.

Your message:
"I would love to see a mobile app version..."

Best regards,
Smart Budget App Team
```

**And** successful submission response:
```json
{
  "success": true,
  "message": "Thank you for your message! We'll get back to you soon."
}
```

**And** on successful submission:
- Form is cleared
- Success toast appears
- Green checkmark icon shown
- Message: "Message sent successfully!"

**And** rate limiting:
- Max 3 submissions per IP per hour
- Max 10 submissions per email per day

**And** spam prevention:
- Honeypot field (hidden input that bots fill)
- Time-based check (reject if submitted < 3 seconds)
- Block common spam keywords

**Prerequisites:** Story 6.1 (landing page exists), Story 11.2 (email service exists)

**Technical Notes:**
- Reuse EmailService from Epic 11
- Use environment variable for owner email: `CONTACT_EMAIL`
- Validate email server-side (don't trust client)
- Consider adding Google reCAPTCHA v3 (invisible)
- Log all contact submissions for analytics
- Admin panel to view submissions (future enhancement)
- Consider webhook to Slack/Discord for instant notifications
- Auto-reply should be plain text + HTML version

---

### Story 6.4: Add SEO Optimization and Performance Improvements

As a visitor,
I want the landing page to load quickly and rank well in search engines,
So that I can find and use the app easily.

**Acceptance Criteria:**

**Given** the landing page is deployed
**When** search engines crawl the page
**Then** SEO metadata and performance optimizations are in place

**And** HTML head includes SEO meta tags:
```html
<head>
  <title>Smart Budget App - AI-Powered Personal Finance Manager</title>
  <meta name="description" content="Transform your finances with AI-powered insights. Track expenses, analyze spending, set goals, and get personalized budget recommendations. Free to start!" />

  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://smartbudgetapp.com/" />
  <meta property="og:title" content="Smart Budget App - AI-Powered Personal Finance Manager" />
  <meta property="og:description" content="Track expenses, analyze spending, and achieve financial goals with AI insights." />
  <meta property="og:image" content="https://smartbudgetapp.com/og-image.jpg" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://smartbudgetapp.com/" />
  <meta name="twitter:title" content="Smart Budget App - AI-Powered Finance" />
  <meta name="twitter:description" content="Track expenses and get AI-powered budget insights." />
  <meta name="twitter:image" content="https://smartbudgetapp.com/twitter-image.jpg" />

  <!-- Additional SEO -->
  <meta name="keywords" content="budget app, expense tracker, personal finance, AI insights, financial goals" />
  <meta name="author" content="Smart Budget App" />
  <link rel="canonical" href="https://smartbudgetapp.com/" />
</head>
```

**And** structured data (JSON-LD):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Smart Budget App",
  "description": "AI-powered personal finance manager for tracking expenses and budget optimization",
  "url": "https://smartbudgetapp.com",
  "applicationCategory": "FinanceApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**And** performance optimizations:
- **Images:**
  - Convert to WebP format
  - Lazy loading on non-hero images
  - Responsive images with srcset
  - Max size: 200KB per image

- **Code:**
  - Code splitting (lazy load sections)
  - Minified CSS and JS
  - Tree-shaking unused code
  - Preload critical fonts

- **Loading:**
  - First Contentful Paint (FCP) < 1.8s
  - Largest Contentful Paint (LCP) < 2.5s
  - Cumulative Layout Shift (CLS) < 0.1

**And** accessibility:
- Semantic HTML tags
- ARIA labels where needed
- Keyboard navigation support
- Alt text on all images
- Color contrast meets WCAG 2.1 AA

**And** analytics integration (optional):
- Google Analytics 4 setup
- Track CTA button clicks
- Track form submissions
- Track scroll depth

**And** sitemap.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://smartbudgetapp.com/</loc>
    <lastmod>2025-11-25</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>
```

**And** robots.txt:
```
User-agent: *
Allow: /
Sitemap: https://smartbudgetapp.com/sitemap.xml
```

**Prerequisites:** Story 6.1 (landing page structure), Story 6.2 (animations), Story 6.3 (contact form)

**Technical Notes:**
- Use React Helmet for dynamic meta tags
- Generate OG images (1200x630px) for social sharing
- Test with Google Lighthouse (aim for 90+ score)
- Use Vite's asset optimization features
- Consider using CDN for static assets
- Test with Google Search Console after deployment
- Monitor Core Web Vitals
- Future: Add blog section for SEO content

---

## Epic 7: AI Financial Advisor (GPT-5.1 Primary)

**Goal:** Integrate GPT-5.1 powered AI to provide personalized financial insights, spending analysis, and interactive chat for budget optimization.

**Value:** Core product differentiator that transforms raw transaction data into actionable intelligence. Provides users with expert-level financial guidance at scale.

**Scope:** GPT-5.1 integration, transaction analysis endpoint, AI chat interface, prompt engineering, request logging, tier-based provider selection (GPT-5.1 primary, Gemini fallback).

**Dependencies:** Epic 10 (subscription tiers for rate limiting)

**Technical Notes:**
- Primary AI: GPT-5.1 (gpt-5.1-chat-latest for adaptive reasoning)
- Fallback AI: Gemini 3.0 Pro (for free tier and failures)
- Use prompt caching for 90% cost savings on repeated queries
- Store AI requests in `user_requests` table from Epic 10
- Time range: User-selectable (30 days, 3 months, 6 months, custom)

---

### Story 7.1: Set Up GPT-5.1 Integration with OpenAI SDK

As a developer,
I want to integrate GPT-5.1 via the OpenAI SDK,
So that the app can leverage AI for financial analysis.

**Acceptance Criteria:**

**Given** the backend needs AI capabilities
**When** I configure the AI service
**Then** GPT-5.1 and Gemini are integrated with fallback logic

**And** OpenAI SDK is installed:
```bash
cd backend
npm install openai
npm install @google/generative-ai
```

**And** environment variables are configured:
```bash
# backend/.env
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIza...
```

**And** AI service is created:
```typescript
// backend/src/features/ai/ai.service.ts

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  /**
   * Test GPT-5.1 connection
   */
  async testGPTConnection(): Promise<boolean> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5.1-chat-latest',
        messages: [
          { role: 'user', content: 'Say "Connection successful"' }
        ],
        max_tokens: 10
      });

      return response.choices[0].message.content.includes('successful');
    } catch (error) {
      console.error('GPT-5.1 connection failed:', error);
      return false;
    }
  }

  /**
   * Test Gemini connection
   */
  async testGeminiConnection(): Promise<boolean> {
    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-3-pro' });
      const result = await model.generateContent('Say "Connection successful"');
      const text = result.response.text();

      return text.includes('successful');
    } catch (error) {
      console.error('Gemini connection failed:', error);
      return false;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ gpt: boolean; gemini: boolean }> {
    const [gptStatus, geminiStatus] = await Promise.all([
      this.testGPTConnection(),
      this.testGeminiConnection()
    ]);

    return {
      gpt: gptStatus,
      gemini: geminiStatus
    };
  }
}
```

**And** health check endpoint exists:
```typescript
// GET /api/ai/health
{
  "success": true,
  "data": {
    "gpt": true,
    "gemini": true,
    "status": "All AI providers operational"
  }
}
```

**And** error handling for missing API keys:
```typescript
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not configured');
}
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not configured');
}
```

**And** AI service is singleton (reuse connections):
```typescript
// backend/src/features/ai/index.ts
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
```

**Prerequisites:** Story 1.4 (environment config), Story 10.1 (subscription tiers)

**Technical Notes:**
- Store API keys in .env (never commit)
- Test connection on server startup
- Log AI provider status
- Monitor API usage and costs
- Consider using OpenAI organization ID for better tracking
- Set reasonable timeouts (30s) to prevent hanging requests
- Implement retry logic with exponential backoff
- Future: Add API key rotation mechanism

---


### Story 7.2: Build Transaction Analysis Endpoint with GPT-5.1

As a user,
I want to get comprehensive AI-powered insights about my spending patterns,
So that I can make better financial decisions based on expert analysis.

**Acceptance Criteria:**

**Given** I am authenticated and have transaction data
**When** I request AI analysis of my transactions
**Then** GPT-5.1 analyzes my data and provides actionable insights

**And** the endpoint `/api/ai/analyze` accepts:
```json
{
  "timeRange": "30days" | "3months" | "6months" | "custom",
  "startDate": "2025-10-01", // If custom
  "endDate": "2025-11-25",   // If custom
  "includeIncome": true // Optional, default true
}
```

**And** the backend builds a comprehensive analysis prompt:
```typescript
// backend/src/features/ai/ai.service.ts

async analyzeTransactions(
  userId: number,
  timeRange: TimeRange,
  includeIncome: boolean = true
): Promise<AIAnalysisResponse> {
  // Fetch user data
  const user = await getUserWithTier(userId);
  const transactions = await getTransactionsForAnalysis(userId, timeRange);
  const userIncome = await getUserIncomeProfile(userId); // From Epic 8
  
  // Route based on tier
  const provider = user.subscriptionTier === 'free' ? 'gemini' : 'gpt-5.1';
  
  if (provider === 'gpt-5.1') {
    return this.analyzeWithGPT(transactions, userIncome, includeIncome);
  } else {
    return this.analyzeWithGemini(transactions, userIncome, includeIncome);
  }
}

private async analyzeWithGPT(
  transactions: Transaction[],
  userIncome?: IncomeProfile,
  includeIncome: boolean = true
): Promise<AIAnalysisResponse> {
  
  const systemPrompt = `You are an expert financial advisor analyzing personal spending patterns.

Your analysis must include these sections:

1. SPENDING OVERVIEW
   - Total income and expenses for the period
   - Net balance (income - expenses)
   - Savings rate percentage
   - Month-over-month trends

2. CATEGORY BREAKDOWN
   - Top 5 spending categories with amounts
   - Unusual spending patterns
   - Categories trending up or down

3. ANOMALY DETECTION
   - Identify outlier transactions
   - Flag unusual spending for the user's patterns
   - Suspicious or duplicate transactions

4. SAVINGS OPPORTUNITIES
   - Specific categories where user could cut spending
   - Quantify potential monthly savings
   - Realistic actionable recommendations

5. BUDGET RECOMMENDATIONS
   - Suggested spending limits by category
   - Income-to-expense ratio analysis
   - Emergency fund adequacy
   
6. PERSONALIZED INSIGHTS
   - User-specific observations
   - Comparison to typical spending patterns
   - Goal alignment (if goals exist)

Format as clear sections with bullet points. Be specific with numbers and percentages.`;

  const userContext = this.buildUserContext(transactions, userIncome, includeIncome);

  const response = await this.openai.chat.completions.create({
    model: 'gpt-5.1-chat-latest', // Adaptive reasoning
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContext }
    ],
    temperature: 0.7, // Balanced creativity and consistency
    max_tokens: 2000,
    store: true, // Enable prompt caching
    metadata: {
      user_id: userId.toString(),
      feature: 'transaction_analysis'
    }
  });

  const insights = response.choices[0].message.content;
  const tokensUsed = response.usage?.total_tokens || 0;
  const cached = response.usage?.prompt_tokens_details?.cached_tokens > 0;

  return {
    insights,
    provider: 'gpt-5.1',
    tokensUsed,
    cached,
    generatedAt: new Date().toISOString()
  };
}

private buildUserContext(
  transactions: Transaction[],
  userIncome?: IncomeProfile,
  includeIncome: boolean = true
): string {
  const summary = this.summarizeTransactions(transactions);
  
  let context = `Analyze my financial data for the past ${transactions.length > 0 ? this.getDateRange(transactions) : '30 days'}:

**INCOME INFORMATION:**
`;

  if (userIncome) {
    context += `Expected Monthly Income: $${userIncome.normalizedMonthlyIncome}
Primary Source: ${userIncome.primaryIncomeSource}
Frequency: ${userIncome.primaryIncomeFrequency}
`;
  } else {
    context += `Monthly Income: Not provided
`;
  }

  context += `
**TRANSACTION SUMMARY:**
Total Transactions: ${transactions.length}
Total Income: $${summary.totalIncome}
Total Expenses: $${summary.totalExpenses}
Net Balance: $${summary.netBalance}
Savings Rate: ${summary.savingsRate}%

**CATEGORY BREAKDOWN (Expenses):**
${this.formatCategoryBreakdown(summary.expensesByCategory)}

${includeIncome ? `**CATEGORY BREAKDOWN (Income):**
${this.formatCategoryBreakdown(summary.incomeByCategory)}
` : ''}

**RECENT TRANSACTIONS (Last 10):**
${this.formatRecentTransactions(transactions.slice(0, 10))}

**TOP EXPENSES:**
${this.formatTopTransactions(summary.topExpenses, 5)}

Provide comprehensive financial insights and actionable recommendations based on this data.`;

  return context;
}
```

**And** successful response:
```json
{
  "success": true,
  "data": {
    "insights": "# SPENDING OVERVIEW\n\nYour spending analysis for the past 30 days...",
    "provider": "gpt-5.1",
    "tokensUsed": 1250,
    "cached": false,
    "generatedAt": "2025-11-25T10:30:00Z"
  },
  "quotaStatus": {
    "remaining": 4,
    "limit": 5,
    "resetAt": "2025-11-26T10:30:00Z"
  }
}
```

**And** insights are formatted in markdown with sections

**And** fallback to Gemini for free tier:
```typescript
private async analyzeWithGemini(
  transactions: Transaction[],
  userIncome?: IncomeProfile,
  includeIncome: boolean = true
): Promise<AIAnalysisResponse> {
  
  const model = this.gemini.getGenerativeModel({ 
    model: 'gemini-3-pro',
    generationConfig: {
      thinking_level: 'low', // Cost optimization for free tier
      temperature: 0.7,
      maxOutputTokens: 2000
    }
  });

  const prompt = this.buildUserContext(transactions, userIncome, includeIncome);
  const result = await model.generateContent(prompt);
  
  return {
    insights: result.response.text(),
    provider: 'gemini-3-pro',
    tokensUsed: 0, // Gemini doesn't expose token count easily
    cached: false,
    generatedAt: new Date().toISOString()
  };
}
```

**And** request is logged after successful generation:
```typescript
await quotaService.logRequest(
  userId,
  'ai_insight',
  response.provider,
  response.tokensUsed
);
```

**Prerequisites:** Story 7.1 (AI integration), Story 10.2 (quota tracking), Story 3.3 (transactions API)

**Technical Notes:**
- Use transaction date range to avoid analyzing too much data
- Limit to 1000 most recent transactions for performance
- Cache system prompt (doesn't change per user)
- Include income data from Epic 8 if available
- Calculate savings rate: (income - expenses) / income * 100
- Use markdown formatting for better readability
- Test with various transaction volumes
- Monitor token usage to optimize costs
- Consider streaming responses for better UX (future)

---


### Story 7.3: Create AI Insights Button and Modal UI

**Summary:** Add "Get AI Insights" button to Transactions page that opens modal with AI-generated analysis.

**Key Features:**
- Button on transactions page header
- Loading state during AI request (30-60 seconds)
- Modal displays markdown-formatted insights
- Sections: Overview, Category Breakdown, Anomalies, Savings Tips, Recommendations
- Time range selector (30 days, 3 months, 6 months, custom)
- "Refresh Analysis" button
- Export insights to PDF (Pro tier only)
- Quota status display (X/Y insights used today)

**Technical:**
- Use React Modal or Chakra UI Modal
- Render markdown with `react-markdown`
- Skeleton loader during generation
- Store last analysis in local storage for quick re-view
- Handle quota exceeded errors gracefully

---

### Story 7.4: Implement AI Chat Interface

**Summary:** Add interactive chat interface where users can ask financial questions with context awareness.

**Key Features:**
- Chat icon/tab in insights modal
- Message history (session-based)
- Context: Automatically includes recent transaction summary
- Quick prompts: "How can I save more?", "What's my biggest expense?", "Am I overspending?"
- GPT-5.1 instant mode for fast responses (2-5 seconds)
- Message streaming (words appear as generated)
- Deep thinking toggle for complex questions

**API Endpoint:**
```typescript
POST /api/ai/chat
{
  "message": "How can I reduce my grocery spending?",
  "conversationHistory": [...], // Previous messages
  "deepThinking": false // Use gpt-5.1-chat-latest (fast) or gpt-5.1 (deep)
}
```

**Technical:**
- Store conversation in component state (not persisted)
- Use SSE or WebSockets for streaming responses
- Auto-scroll to newest message
- Character limit: 500 chars per message
- Max 10 messages per conversation
- Clear conversation button

---

### Story 7.5: Add Request Tracking and Tier-Based Routing

**Summary:** Integrate quota checking and log all AI requests with tier-based provider selection.

**Key Features:**
- Before analysis: Check quota (Epic 10.2)
- Route Free tier → Gemini, Basic/Pro → GPT-5.1
- Log all requests to `user_requests` table
- Include token usage, provider, timestamp
- Show quota warning at 80% (e.g., "4/5 insights used")
- Quota exceeded modal: "Upgrade to Basic for 50/day"
- Admin dashboard: View AI usage stats (future)

**Error Handling:**
- Quota exceeded: Show upgrade prompt
- AI provider error: Fallback to other provider
- Timeout (>60s): Show error, offer retry
- Invalid response: Log and show generic error

**Technical:**
- Use middleware from Epic 10.3
- Implement provider fallback chain: GPT → Gemini → Error
- Monitor and alert on high error rates
- Track cost per user for optimization

---

## Epic 8: Income Profile & AI Budget Recommendations

**Goal:** Enable users to input salary and income information for AI-powered budget recommendations.

**Value:** Personalizes financial advice by understanding income context. Enables income-to-expense ratio analysis and overspending alerts.

**Dependencies:** Epic 7 (AI infrastructure), Epic 10 (subscription tiers)

---

### Story 8.1: Create User Income Profile Schema and API

**Summary:** Add income profile table and CRUD endpoints.

**Database Schema:**
```sql
CREATE TABLE user_income_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  primary_income_amount DECIMAL(10,2),
  primary_income_frequency VARCHAR(20) CHECK (frequency IN ('hourly', 'weekly', 'biweekly', 'monthly', 'annual')),
  primary_income_source VARCHAR(100),
  additional_monthly_income DECIMAL(10,2) DEFAULT 0,
  normalized_monthly_income DECIMAL(10,2), -- Auto-calculated
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
- `GET /api/user/income` - Get income profile
- `POST /api/user/income` - Create/update income profile
- `DELETE /api/user/income` - Remove income profile (set to null)

**Normalization Logic:**
- Hourly: amount × 40 hours × 4.33 weeks
- Weekly: amount × 4.33
- Biweekly: amount × 2.17
- Monthly: amount × 1
- Annual: amount ÷ 12

---

### Story 8.2: Build Income Profile Form in Settings

**Summary:** Create UI for users to input and manage income information.

**Form Fields:**
- Primary income amount (number, required)
- Frequency (dropdown: Hourly, Weekly, Biweekly, Monthly, Annual)
- Income source (text: "Acme Corp", "Self-employed", etc.)
- Additional monthly income (number, optional, help text: "Freelance, investments, etc.")
- Calculated display: "Your monthly income: $X,XXX"

**UX Features:**
- Real-time calculation preview
- Save button
- "Skip for now" option (optional field)
- Help text explaining why income helps AI
- Privacy note: "Your income is private and never shared"

---

### Story 8.3: Integrate Income Context into AI Analysis

**Summary:** Enhance AI prompts with income data for better recommendations.

**AI Prompt Enhancement:**
```typescript
const prompt = `
User Income Profile:
- Expected Monthly Income: $${income.normalizedMonthlyIncome}
- Primary Source: ${income.primaryIncomeSource}
- Additional Income: $${income.additionalMonthlyIncome}

Actual Income (from transactions): $${actualIncome}

Please analyze:
1. Is user living within their means?
2. Recommended savings rate (suggest 20% of income)
3. Budget allocation (50/30/20 rule)
4. Income shortfall or surplus
5. Emergency fund target (3-6 months expenses)
`;
```

**New Insights:**
- "Your expenses are 85% of income - good ratio!"
- "You spent $500 more than you earned this month"
- "Recommended emergency fund: $15,000 (6 months)"
- "Try saving $800/month (20% of income)"

---

### Story 8.4: Build Overspending Alert System

**Summary:** Alert users when expenses exceed income threshold.

**Alert Triggers:**
- Monthly expenses > 90% of monthly income
- Monthly expenses > 100% of income
- Negative net balance for 2+ consecutive months

**Alert Delivery:**
- Real-time toast notification
- Dashboard banner (dismissible)
- Email notification (opt-in)
- SMS notification (Pro tier, future)

**Alert Content:**
```
⚠️ Overspending Alert

You've spent $4,500 of your $5,000 monthly income (90%).

AI Recommendation: Reduce "Dining Out" by $300/month to stay on track.

[View Details] [Dismiss]
```

**Technical:**
- Background job checks daily
- Store alerts in `user_alerts` table
- Mark as read/dismissed
- Include AI suggestion in alert

---

### Story 8.5: Add Multiple Income Streams Support (Optional)

**Summary:** Allow users to track multiple income sources separately.

**Extension:**
```sql
CREATE TABLE income_streams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  source_name VARCHAR(100),
  amount DECIMAL(10,2),
  frequency VARCHAR(20),
  is_primary BOOLEAN DEFAULT false
);
```

**Use Case:** User has salary + freelance + rental income

**Deferred to:** Phase 3 (keep simple for Phase 2)

---

## Epic 9: Financial Goal Tracking

**Goal:** Enable users to set savings goals and track progress with dynamic timelines.

**Value:** Motivates users by visualizing progress toward meaningful objectives. Provides accountability and milestone tracking.

**Dependencies:** Epic 8 (income data for timeline calculations)

---

### Story 9.1: Create Goals Schema and CRUD API

**Summary:** Database and API for goal management.

**Schema:**
```sql
CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  goal_type VARCHAR(50) CHECK (type IN ('savings', 'purchase', 'debt_payoff')),
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', '
# Epic 7 Continuation & Remaining Epics (Summaries)

### Story 7.3: Create AI Insights Button and Modal UI

**Summary:** Add "Get AI Insights" button to Transactions page that opens modal with AI-generated analysis.

**Key Features:**
- Button on transactions page header
- Loading state during AI request (30-60 seconds)
- Modal displays markdown-formatted insights
- Sections: Overview, Category Breakdown, Anomalies, Savings Tips, Recommendations
- Time range selector (30 days, 3 months, 6 months, custom)
- "Refresh Analysis" button
- Export insights to PDF (Pro tier only)
- Quota status display (X/Y insights used today)

**Technical:**
- Use React Modal or Chakra UI Modal
- Render markdown with `react-markdown`
- Skeleton loader during generation
- Store last analysis in local storage for quick re-view
- Handle quota exceeded errors gracefully

---

### Story 7.4: Implement AI Chat Interface

**Summary:** Add interactive chat interface where users can ask financial questions with context awareness.

**Key Features:**
- Chat icon/tab in insights modal
- Message history (session-based)
- Context: Automatically includes recent transaction summary
- Quick prompts: "How can I save more?", "What's my biggest expense?", "Am I overspending?"
- GPT-5.1 instant mode for fast responses (2-5 seconds)
- Message streaming (words appear as generated)
- Deep thinking toggle for complex questions

**API Endpoint:**
```typescript
POST /api/ai/chat
{
  "message": "How can I reduce my grocery spending?",
  "conversationHistory": [...],
  "deepThinking": false
}
```

**Technical:**
- Store conversation in component state (not persisted)
- Use SSE or WebSockets for streaming responses
- Auto-scroll to newest message
- Character limit: 500 chars per message
- Max 10 messages per conversation
- Clear conversation button

---

### Story 7.5: Add Request Tracking and Tier-Based Routing

**Summary:** Integrate quota checking and log all AI requests with tier-based provider selection.

**Key Features:**
- Before analysis: Check quota (Epic 10.2)
- Route Free tier → Gemini, Basic/Pro → GPT-5.1
- Log all requests to `user_requests` table
- Include token usage, provider, timestamp
- Show quota warning at 80% (e.g., "4/5 insights used")
- Quota exceeded modal: "Upgrade to Basic for 50/day"

**Error Handling:**
- Quota exceeded: Show upgrade prompt
- AI provider error: Fallback to other provider
- Timeout (>60s): Show error, offer retry
- Invalid response: Log and show generic error

---

## Epic 8: Income Profile & AI Budget Recommendations

**Goal:** Enable users to input salary and income information for AI-powered budget recommendations.

**Dependencies:** Epic 7 (AI infrastructure), Epic 10 (subscription tiers)

---

### Story 8.1: Create User Income Profile Schema and API

**Database Schema:**
```sql
CREATE TABLE user_income_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  primary_income_amount DECIMAL(10,2),
  primary_income_frequency VARCHAR(20),
  primary_income_source VARCHAR(100),
  additional_monthly_income DECIMAL(10,2) DEFAULT 0,
  normalized_monthly_income DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
- GET /api/user/income
- POST /api/user/income
- DELETE /api/user/income

**Normalization:** Hourly → Monthly, Weekly → Monthly, Annual → Monthly

---

### Story 8.2: Build Income Profile Form in Settings

**Form Fields:**
- Primary income amount
- Frequency (Hourly, Weekly, Biweekly, Monthly, Annual)
- Income source
- Additional monthly income (optional)
- Real-time calculation preview

---

### Story 8.3: Integrate Income Context into AI Analysis

**AI Enhancements:**
- Include income in analysis prompt
- Calculate income-to-expense ratio
- Recommend savings rate (20% of income)
- Emergency fund target (3-6 months)
- Budget allocation (50/30/20 rule)

---

### Story 8.4: Build Overspending Alert System

**Alert Triggers:**
- Expenses > 90% of income
- Expenses > 100% of income
- Negative balance 2+ months

**Delivery:** Toast, Dashboard banner, Email (opt-in)

---

## Epic 9: Financial Goal Tracking

**Goal:** Set savings goals and track progress with dynamic timelines.

**Dependencies:** Epic 8 (income for timeline calculation)

---

### Story 9.1: Create Goals Schema and CRUD API

**Schema:**
```sql
CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(200),
  goal_type VARCHAR(50),
  target_amount DECIMAL(10,2),
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  priority VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active'
);
```

**Tier Limits:** Free: 3, Basic: 10, Pro: Unlimited

---

### Story 9.2: Build Goal Creation and Management UI

**Features:**
- Create goal form
- Goals dashboard with progress bars
- Sort by priority/deadline/progress
- Quick actions: Add money, Edit, Delete

---

### Story 9.3: Implement Progress Calculation and Manual Allocation

**Flow:**
- User clicks "Add to Goal"
- Enter amount to allocate
- Updates current_amount
- Recalculates progress

---

### Story 9.4: Build Goals Dashboard with Visualizations

**Components:**
- Goals overview card
- Individual goal cards with progress
- Timeline chart
- Projected completion dates

---

### Story 9.5: Dynamic Timeline Recalculation

**Triggers:**
- Income updated
- Expense pattern changes

**Calculation:**
```typescript
monthsToGoal = (target - current) / (income - avgExpenses)
```

**Notification:** "You'll reach your goal X months faster!"

---

## Epic 12: AI Bill Comparison Tool

**Goal:** Compare two bills using GPT-5.1 Vision.

**Dependencies:** Epic 7 (AI), Epic 10 (tier limits)

---

### Story 12.1: Implement Image Upload and Storage

**Features:**
- Drag-and-drop upload
- JPG, PNG (max 5MB)
- Image preview
- Store as base64 or file path

**Tier Limits:** Free: 5 comparisons, Basic: 25, Pro: Unlimited

---

### Story 12.2: Build Bill Comparison with GPT-5.1 Vision

**API:**
```typescript
POST /api/bills/compare
// Sends 2 images to GPT-5.1 Vision
// Returns JSON with items, prices, matches
```

**AI Task:** OCR + Item extraction + Matching + Price comparison

---

### Story 12.3: Parse Results and Calculate Differences

**Calculations:**
- Total difference
- Per-item differences
- Percent changes
- Average inflation rate

---

### Story 12.4: Build Comparison Results UI

**Sections:**
- Bill summaries
- Total comparison
- Matched items table
- Unmatched items
- AI summary

---

## Implementation Roadmap

**Weeks 1-2:** Epic 10, 11 (Foundation)
**Weeks 3-4:** Epic 6 (Landing Page)
**Weeks 5-7:** Epic 7, 8 (AI Features)
**Weeks 8-10:** Epic 9, 12 (Advanced)

**Total:** 29 stories across 7 epics

---

_Append this to epics-phase2.md_
