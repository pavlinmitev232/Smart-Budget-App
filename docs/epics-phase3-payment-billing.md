# Epic 13: Payment & Billing Integration (Phase 3)

**Author:** pavlin (PM: John)
**Date:** 2025-11-30
**Project Level:** Level 2 (BMad Method)
**Target Scale:** 1 Epic, 6 Stories
**Phase:** Phase 3 (Post-MVP, Post-AI Features)

---

## Overview

This epic implements **user self-service subscription upgrades** with Stripe payment integration, replacing the placeholder "Coming Soon" functionality from Epic 10. Additionally, it provides admin tools for manual subscription management and billing oversight.

**Why This Epic:**
- Epic 10 created subscription tiers and quota system ✅
- Epic 10.4 created UI with "Coming Soon" placeholder ✅
- **Epic 13 enables actual upgrades** with real payment processing

**Dependencies:**
- Epic 10 (Subscription tier system must be complete)
- Stripe account and API keys

---

## Epic 13: Payment & Billing Integration

**Goal:** Enable users to self-upgrade to Basic/Pro tiers via Stripe Checkout, with admin tools for manual subscription management and billing oversight.

**Value:**
- **Revenue Generation:** Converts free users to paying customers
- **User Autonomy:** Self-service upgrades without manual intervention
- **Admin Control:** Override capabilities for support scenarios

**Scope:**
- Stripe Checkout integration (Basic/Pro tiers)
- Webhook handling for subscription events
- Admin endpoints for manual tier management
- Billing history and invoice viewing
- Subscription cancellation flow

**Out of Scope (Future):**
- Annual billing (monthly only for Phase 3)
- Proration for mid-month upgrades
- Tax calculation (simple pricing only)
- Multiple payment methods (card only)

---

## Story 13.1: Integrate Stripe Checkout for Subscription Upgrades

**As a** user on the Free tier,
**I want to** click "Upgrade to Basic" and complete payment via Stripe Checkout,
**So that** I can unlock higher quotas and premium features.

### Acceptance Criteria

**AC1: Stripe Account Setup**

**Given** the application needs payment processing
**When** the backend initializes
**Then** Stripe SDK is configured with API keys

**And** environment variables are set:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**AC2: Checkout Session Creation Endpoint**

**And** the endpoint `POST /api/payments/create-checkout-session` exists:

```typescript
// Request
{
  "tier": "basic" | "pro"
}

// Response
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
}
```

**AC3: Stripe Product Configuration**

**And** Stripe products are created:
- **Basic Plan:** $10/month (price_basic_monthly)
- **Pro Plan:** $30/month (price_pro_monthly)

**AC4: Checkout Flow**

**Given** I am logged in as a Free user
**When** I click "Upgrade to Basic" on the Subscription page
**Then** the frontend calls `/api/payments/create-checkout-session`
**And** I am redirected to Stripe Checkout
**And** I can enter payment details (card, billing info)
**And** after successful payment, I am redirected to `/subscription?success=true`

**AC5: Success Callback Handling**

**And** the `/subscription` page shows:
```
✅ Payment Successful!
Your subscription has been activated. You now have Basic tier access.
[View Subscription Details]
```

**AC6: Cancel Callback Handling**

**And** if I cancel the checkout flow
**Then** I am redirected to `/subscription?canceled=true`
**And** the page shows:
```
❌ Payment Canceled
You can upgrade anytime by clicking "Upgrade" below.
[Back to Subscription]
```

### Prerequisites

- Story 10.1 (subscription schema)
- Story 10.4 (subscription UI)
- Stripe account created
- Test mode API keys obtained

### Technical Notes

**Backend:**
```typescript
// backend/src/features/payments/stripe.service.ts
import Stripe from 'stripe';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createCheckoutSession(
    userId: number,
    tier: 'basic' | 'pro',
    userEmail: string
  ): Promise<Stripe.Checkout.Session> {
    const priceId = tier === 'basic'
      ? process.env.STRIPE_PRICE_BASIC
      : process.env.STRIPE_PRICE_PRO;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId.toString(),
      success_url: `${process.env.FRONTEND_URL}/subscription?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
      metadata: {
        userId: userId.toString(),
        tier,
      },
    });

    return session;
  }
}
```

**Frontend:**
```typescript
// frontend/src/pages/Subscription.tsx
const handleUpgrade = async (tier: 'basic' | 'pro') => {
  try {
    const response = await api.post('/payments/create-checkout-session', { tier });

    // Redirect to Stripe Checkout
    window.location.href = response.data.data.url;
  } catch (error) {
    toast.error('Failed to initiate checkout');
  }
};
```

**Security:**
- Validate user is authenticated before creating session
- Verify user doesn't already have equal/higher tier
- Store session ID for verification
- Never expose Stripe secret key to frontend

---

## Story 13.2: Handle Stripe Webhook Events for Subscription Updates

**As a** system,
**I want to** listen for Stripe webhook events and update user subscription tiers,
**So that** users automatically get access when payment succeeds.

### Acceptance Criteria

**AC1: Webhook Endpoint**

**Given** Stripe sends subscription events
**When** a webhook is received at `POST /api/payments/webhook`
**Then** the event is verified and processed

**AC2: Checkout Session Completed Event**

**And** when `checkout.session.completed` event is received:
- Extract `client_reference_id` (userId)
- Extract `metadata.tier` (basic/pro)
- Update user's `subscription_tier` in database
- Log subscription activation

**AC3: Subscription Deleted Event**

**And** when `customer.subscription.deleted` event is received:
- Downgrade user to `free` tier
- Log subscription cancellation

**AC4: Payment Failed Event**

**And** when `invoice.payment_failed` event is received:
- Log payment failure
- Send email notification to user
- Maintain current tier for grace period (7 days)

**AC5: Webhook Signature Verification**

**And** all webhooks verify Stripe signature:
```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Prerequisites

- Story 13.1 (Stripe Checkout)
- Webhook endpoint configured in Stripe Dashboard

### Technical Notes

```typescript
// backend/src/features/payments/webhook.controller.ts
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook validation failed' });
  }
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = parseInt(session.client_reference_id!);
  const tier = session.metadata!.tier;

  await pool.query(
    `UPDATE users
     SET subscription_tier = $1,
         stripe_customer_id = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [tier, session.customer, userId]
  );

  console.log(`✅ User ${userId} upgraded to ${tier} via Stripe`);
}
```

**Webhook Testing:**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:5000/api/payments/webhook`
- Test all event types before production

---

## Story 13.3: Build Admin Subscription Management Endpoint

**As an** administrator,
**I want to** manually update user subscription tiers,
**So that** I can handle support requests and special cases.

### Acceptance Criteria

**AC1: Admin Authentication**

**Given** an admin user is logged in
**When** making admin API requests
**Then** the system verifies admin role

**AC2: Admin Tier Update Endpoint**

**And** the endpoint `PUT /api/admin/users/:userId/subscription` exists:

```typescript
// Request
{
  "tier": "free" | "basic" | "pro",
  "reason": "Customer support request #123"
}

// Response
{
  "success": true,
  "data": {
    "userId": 123,
    "previousTier": "free",
    "newTier": "basic",
    "updatedBy": "admin@example.com",
    "reason": "Customer support request #123",
    "updatedAt": "2025-11-30T10:30:00Z"
  }
}
```

**AC3: Audit Logging**

**And** all admin tier changes are logged to `subscription_audit_log` table:

```sql
CREATE TABLE subscription_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  previous_tier VARCHAR(20),
  new_tier VARCHAR(20),
  changed_by_admin_id INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**AC4: Admin Role Check**

**And** only users with `role = 'admin'` can access admin endpoints
**And** unauthorized attempts return 403 Forbidden

### Prerequisites

- Story 10.1 (subscription schema)
- Admin role added to users table

### Technical Notes

```typescript
// backend/src/middleware/adminAuth.ts
export const adminOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.userId;

  const result = await pool.query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows[0]?.role !== 'admin') {
    return sendError(res, 'Admin access required', 'FORBIDDEN', 403);
  }

  next();
};

// Usage
router.put('/admin/users/:userId/subscription',
  authMiddleware,
  adminOnly,
  updateUserSubscription
);
```

**Migration: Add admin role**
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## Story 13.4: Display Billing History and Invoices

**As a** user,
**I want to** view my billing history and download invoices,
**So that** I can track my subscription payments.

### Acceptance Criteria

**AC1: Billing History Endpoint**

**Given** I am a paying user (Basic/Pro)
**When** I request billing history
**Then** I see a list of all payments

**And** the endpoint `GET /api/user/billing/history` returns:

```json
{
  "success": true,
  "data": {
    "subscriptionStatus": "active",
    "currentTier": "basic",
    "nextBillingDate": "2025-12-30",
    "invoices": [
      {
        "id": "in_abc123",
        "date": "2025-11-30",
        "amount": 1000,
        "currency": "usd",
        "status": "paid",
        "invoicePdf": "https://pay.stripe.com/invoice/..."
      }
    ]
  }
}
```

**AC2: Billing History UI**

**And** the Subscription page shows a "Billing History" section:
- Table with columns: Date, Amount, Status, Invoice
- Download PDF button for each invoice
- "Next billing date: Dec 30, 2025"

**AC3: Free Users See Upgrade Prompt**

**And** Free tier users see:
```
No billing history. Upgrade to Basic or Pro to access premium features.
[Upgrade Now]
```

### Prerequisites

- Story 13.1 (Stripe Checkout)
- Story 13.2 (Webhooks)

### Technical Notes

**Fetch invoices from Stripe:**
```typescript
async getBillingHistory(userId: number) {
  const user = await getUserWithStripeId(userId);

  const invoices = await stripe.invoices.list({
    customer: user.stripeCustomerId,
    limit: 12,
  });

  return invoices.data.map(inv => ({
    id: inv.id,
    date: new Date(inv.created * 1000),
    amount: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    invoicePdf: inv.invoice_pdf,
  }));
}
```

---

## Story 13.5: Implement Subscription Cancellation Flow

**As a** user,
**I want to** cancel my subscription,
**So that** I stop being charged and downgrade to Free tier.

### Acceptance Criteria

**AC1: Cancel Subscription Endpoint**

**Given** I am a paying subscriber
**When** I request cancellation
**Then** my Stripe subscription is canceled

**And** the endpoint `POST /api/payments/cancel-subscription` exists:

```json
// Response
{
  "success": true,
  "data": {
    "message": "Subscription canceled successfully",
    "effectiveDate": "2025-12-30",
    "accessUntil": "2025-12-30"
  }
}
```

**AC2: Subscription Page UI**

**And** the Subscription page shows:
- "Cancel Subscription" button (red, secondary)
- Confirmation modal:
  ```
  Cancel Your Subscription?

  You'll lose access to premium features on Dec 30, 2025.
  You can resubscribe anytime.

  [Keep Subscription] [Yes, Cancel]
  ```

**AC3: Immediate Cancellation**

**And** when I confirm cancellation:
- Stripe subscription is set to `cancel_at_period_end = true`
- I retain access until period end
- Database tier remains unchanged until period end
- Webhook handles actual downgrade on period end

**AC4: Cancellation Confirmation**

**And** after cancellation, the page shows:
```
⚠️ Subscription Canceled

Your subscription will remain active until Dec 30, 2025.
After that, you'll be downgraded to Free tier.

[Reactivate Subscription]
```

### Prerequisites

- Story 13.1 (Stripe Checkout)
- Story 13.2 (Webhooks)

### Technical Notes

```typescript
async cancelSubscription(userId: number) {
  const user = await getUserWithStripeId(userId);

  const subscription = await stripe.subscriptions.update(
    user.stripeSubscriptionId,
    {
      cancel_at_period_end: true,
    }
  );

  return {
    effectiveDate: new Date(subscription.current_period_end * 1000),
  };
}
```

**Reactivation:**
```typescript
async reactivateSubscription(userId: number) {
  const user = await getUserWithStripeId(userId);

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
}
```

---

## Story 13.6: Add Stripe Customer Portal Integration

**As a** user,
**I want to** manage my payment methods and billing details,
**So that** I can update my card or address without admin help.

### Acceptance Criteria

**AC1: Customer Portal Session Endpoint**

**Given** I am a paying subscriber
**When** I click "Manage Billing"
**Then** I am redirected to Stripe Customer Portal

**And** the endpoint `POST /api/payments/customer-portal` returns:

```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/..."
  }
}
```

**AC2: Portal Features**

**And** the Customer Portal allows:
- Update payment method
- Update billing address
- View invoice history
- Cancel subscription
- Download invoices

**AC3: Return URL**

**And** after using the portal, I am redirected back to `/subscription`

### Prerequisites

- Story 13.1 (Stripe Checkout)

### Technical Notes

```typescript
async createCustomerPortalSession(userId: number) {
  const user = await getUserWithStripeId(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/subscription`,
  });

  return { url: session.url };
}
```

**Enable Customer Portal in Stripe Dashboard:**
- Business information
- Branding (logo, colors)
- Features: Update payment method, Cancel subscription

---

## Implementation Roadmap

### Week 1: Stripe Integration Foundation
- **Day 1-2:** Story 13.1 - Stripe Checkout integration
- **Day 3-4:** Story 13.2 - Webhook handling
- **Day 5:** Testing with Stripe test mode

### Week 2: Admin & User Features
- **Day 1-2:** Story 13.3 - Admin subscription management
- **Day 3:** Story 13.4 - Billing history UI
- **Day 4:** Story 13.5 - Cancellation flow
- **Day 5:** Story 13.6 - Customer Portal

### Week 3: Testing & Deployment
- **Day 1-2:** Integration testing (Stripe test mode)
- **Day 3:** Security review and penetration testing
- **Day 4:** Documentation and admin training
- **Day 5:** Production deployment

---

## Testing Strategy

### Stripe Test Mode
- Use test card: `4242 4242 4242 4242`
- Test webhook events with Stripe CLI
- Verify all payment flows

### Test Scenarios
1. ✅ Free → Basic upgrade (successful payment)
2. ✅ Free → Pro upgrade (successful payment)
3. ❌ Free → Basic upgrade (payment declined)
4. ✅ Basic → Pro upgrade (change subscription)
5. ✅ Basic → Free downgrade (cancellation)
6. ✅ Admin manual tier override
7. ✅ Webhook event handling (all types)
8. ✅ Invoice generation and PDF download

---

## Security Considerations

### Payment Security
- ✅ Never store card details (Stripe handles PCI compliance)
- ✅ Verify webhook signatures
- ✅ Use HTTPS in production
- ✅ Validate all inputs server-side

### Admin Security
- ✅ Role-based access control for admin endpoints
- ✅ Audit logging for all tier changes
- ✅ Rate limiting on admin endpoints

### Data Protection
- ✅ Encrypt Stripe API keys in environment
- ✅ Log only non-sensitive data
- ✅ GDPR compliance for billing data

---

## Production Checklist

Before going live with real payments:

- [ ] Switch from Stripe test mode to live mode
- [ ] Update environment variables with live API keys
- [ ] Configure live webhook endpoint in Stripe Dashboard
- [ ] Enable HTTPS (required for Stripe)
- [ ] Set up monitoring for webhook failures
- [ ] Add error alerting (failed payments, webhook errors)
- [ ] Configure Stripe email receipts
- [ ] Update Terms of Service with refund policy
- [ ] Test live mode with real $1 payment
- [ ] Train support team on admin tools

---

## Revenue Projections (Example)

**Assumptions:**
- 1000 free users
- 5% conversion to Basic ($10/mo)
- 1% conversion to Pro ($30/mo)

**Monthly Revenue:**
- Basic: 50 users × $10 = $500
- Pro: 10 users × $30 = $300
- **Total: $800/month**

**Annual Revenue:** ~$9,600

Adjust pricing based on actual conversion rates and user feedback.

---

## Future Enhancements (Phase 4+)

- Annual billing (20% discount)
- Proration for mid-month upgrades
- Multiple payment methods (PayPal, Apple Pay)
- Team/Family plans (shared subscriptions)
- Gifting subscriptions
- Referral program (free month for referrals)
- Volume discounts for enterprises

---

**Epic Status:** 📝 PLANNED - Ready for Phase 3 implementation

**Total Stories:** 6
**Estimated Effort:** 2-3 weeks
**Dependencies:** Epic 10 complete, Stripe account setup
