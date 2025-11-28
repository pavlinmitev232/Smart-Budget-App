import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { quotaService, QuotaCheckResult, RequestType } from '../features/subscriptions/quota.service';
import { SubscriptionTierName } from '../config/subscriptions';
import pool from '../config/database';

/**
 * Extended AuthRequest with subscription tier and quota check info
 */
export interface FeatureGatedRequest extends AuthRequest {
  user: {
    userId: number;
    email: string;
    subscriptionTier?: SubscriptionTierName;
  };
  quotaCheck?: QuotaCheckResult;
}

/**
 * Get user with subscription tier from database
 */
async function getUserWithTier(userId: number): Promise<{
  id: number;
  email: string;
  subscription_tier: SubscriptionTierName;
}> {
  const query = `
    SELECT id, email, subscription_tier
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [userId]);

  if (result.rows.length === 0) {
    throw new Error(`User not found: ${userId}`);
  }

  return result.rows[0];
}

/**
 * Middleware to enforce subscription tier requirements
 *
 * @param minTier - Minimum required tier ('free', 'basic', or 'pro')
 * @returns Express middleware function
 *
 * @example
 * router.get('/export', requireTier('basic'), exportData);
 */
export const requireTier = (minTier: SubscriptionTierName) => {
  return async (req: FeatureGatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await getUserWithTier(req.user!.userId);

      const tierHierarchy: Record<SubscriptionTierName, number> = {
        free: 0,
        basic: 1,
        pro: 2,
      };

      const userTierLevel = tierHierarchy[user.subscription_tier];
      const requiredTierLevel = tierHierarchy[minTier];

      if (userTierLevel < requiredTierLevel) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_TIER',
            message: `This feature requires ${minTier} tier or higher. Current tier: ${user.subscription_tier}`,
            currentTier: user.subscription_tier,
            requiredTier: minTier,
          },
        });
      }

      // Attach subscription tier to request for use in handlers
      req.user.subscriptionTier = user.subscription_tier;
      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to verify subscription tier',
        },
      });
    }
  };
};

/**
 * Middleware to check and enforce quota limits
 *
 * @param requestType - Type of request ('ai_insight' or 'bill_comparison')
 * @returns Express middleware function
 *
 * @example
 * router.post('/ai/analyze', checkQuota('ai_insight'), analyzeData);
 */
export const checkQuota = (requestType: RequestType) => {
  return async (req: FeatureGatedRequest, res: Response, next: NextFunction) => {
    try {
      const quotaCheck = await quotaService.checkQuota(req.user!.userId, requestType);

      if (!quotaCheck.allowed) {
        const requestTypeLabel = requestType === 'ai_insight' ? 'AI insight' : 'bill comparison';
        const upgradeMessage =
          quotaCheck.remaining === 0
            ? 'Upgrade to Basic for 50/day or Pro for unlimited.'
            : 'Upgrade for higher limits.';

        return res.status(429).json({
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `Daily ${requestTypeLabel} limit reached. ${upgradeMessage}`,
            quotaStatus: {
              remaining: quotaCheck.remaining,
              resetAt: quotaCheck.resetAt,
            },
          },
        });
      }

      // Store quota info in request for post-request logging
      req.quotaCheck = quotaCheck;
      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to check quota',
        },
      });
    }
  };
};

/**
 * Combined middleware for protected AI endpoints
 *
 * Applies authentication and quota checking in correct order
 *
 * @param requestType - Type of AI request
 * @returns Array of middleware functions
 *
 * @example
 * router.post('/ai/analyze', ...protectAIEndpoint('ai_insight'), analyzeData);
 */
export const protectAIEndpoint = (requestType: RequestType) => {
  return [checkQuota(requestType)];
};

/**
 * Helper to log request after successful completion
 *
 * Call this in your controller after successfully processing the request
 *
 * @example
 * const result = await processAIRequest();
 * await logQuotaUsage(req, 'ai_insight', 'gpt-5.1', 150);
 */
export async function logQuotaUsage(
  req: FeatureGatedRequest,
  requestType: RequestType,
  provider: string,
  tokensUsed?: number
): Promise<void> {
  await quotaService.logRequest(req.user!.userId, requestType, provider, tokensUsed);
}
