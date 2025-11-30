import express from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { getSubscriptionStatus } from './subscription.controller';
import { sendSuccess, sendError } from '../../utils/response';
import pool from '../../config/database';
import { config } from '../../config/env';

const router = express.Router();

/**
 * GET /api/user/subscription
 * Get current user's subscription status and quota
 */
router.get('/api/user/subscription', authMiddleware, getSubscriptionStatus);

/**
 * PUT /api/user/subscription/admin-override
 *
 * DEVELOPMENT/TESTING ONLY ENDPOINT
 * Manually update the authenticated user's subscription tier
 *
 * This endpoint is ONLY available when NODE_ENV is 'development' or 'test'
 * It will return 404 in production environments
 *
 * Use for testing tier-based features without payment integration
 */
if (config.nodeEnv === 'development' || config.nodeEnv === 'test') {
  router.put('/api/user/subscription/admin-override', authMiddleware, async (req: AuthRequest, res) => {
    const { tier } = req.body;
    const userId = req.user!.userId;

    // Validate tier
    const validTiers = ['free', 'basic', 'pro'];
    if (!tier || !validTiers.includes(tier)) {
      return sendError(
        res,
        `Invalid tier. Must be one of: ${validTiers.join(', ')}`,
        'INVALID_TIER',
        400
      );
    }

    try {
      // Get current tier
      const currentResult = await pool.query(
        'SELECT subscription_tier FROM users WHERE id = $1',
        [userId]
      );
      const currentTier = currentResult.rows[0]?.subscription_tier || 'free';

      // Update user tier
      await pool.query(
        'UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2',
        [tier, userId]
      );

      console.log(`🧪 [DEV ONLY] User ${userId} subscription tier updated: ${currentTier} → ${tier}`);

      return sendSuccess(
        res,
        {
          message: `Subscription tier updated successfully`,
          previousTier: currentTier,
          newTier: tier,
          warning: 'This is a development-only endpoint. Payment integration required for production.'
        },
        200
      );
    } catch (error: any) {
      console.error('[ADMIN OVERRIDE] Failed to update subscription tier:', error);
      return sendError(
        res,
        'Failed to update subscription tier',
        'UPDATE_FAILED',
        500,
        { error: error.message }
      );
    }
  });

  console.log('🧪 [DEV MODE] Admin subscription override endpoint enabled: PUT /api/user/subscription/admin-override');
}

export default router;
