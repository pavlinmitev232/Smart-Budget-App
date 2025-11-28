import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { quotaService } from './quota.service';
import { SUBSCRIPTION_TIERS, SubscriptionTierName } from '../../config/subscriptions';
import pool from '../../config/database';

/**
 * Get user's subscription status and quota information
 */
export async function getSubscriptionStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // Get user with subscription tier
    const userQuery = `
      SELECT id, email, subscription_tier, created_at
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const user = userResult.rows[0];
    const tier: SubscriptionTierName = user.subscription_tier;

    // Get quota status
    const quotaStatus = await quotaService.getQuotaStatus(userId);

    // Calculate usage counts
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const aiInsightsQuery = `
      SELECT COUNT(*) as count
      FROM user_requests
      WHERE user_id = $1
        AND request_type = 'ai_insight'
        AND request_timestamp > $2
    `;
    const billComparisonsQuery = `
      SELECT COUNT(*) as count
      FROM user_requests
      WHERE user_id = $1
        AND request_type = 'bill_comparison'
        AND request_timestamp > $2
    `;

    const [aiResult, billResult] = await Promise.all([
      pool.query(aiInsightsQuery, [userId, twentyFourHoursAgo]),
      pool.query(billComparisonsQuery, [userId, twentyFourHoursAgo]),
    ]);

    const aiInsightsUsed = parseInt(aiResult.rows[0].count);
    const billComparisonsUsed = parseInt(billResult.rows[0].count);

    // Get tier features
    const tierConfig = SUBSCRIPTION_TIERS[tier];

    return res.status(200).json({
      success: true,
      data: {
        tier,
        tierName: tierConfig.name,
        price: tierConfig.price,
        memberSince: user.created_at,
        quotaStatus: {
          aiInsights: {
            used: aiInsightsUsed,
            limit: tierConfig.features.aiInsightsPerDay,
            remaining: quotaStatus.aiInsights.remaining,
            resetAt: quotaStatus.aiInsights.resetAt,
          },
          billComparisons: {
            used: billComparisonsUsed,
            limit: tierConfig.features.billComparisonsPerDay,
            remaining: quotaStatus.billComparisons.remaining,
            resetAt: quotaStatus.billComparisons.resetAt,
          },
        },
        features: tierConfig.features,
        canUpgrade: tier !== 'pro',
      },
    });
  } catch (error: any) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get subscription status',
      },
    });
  }
}
