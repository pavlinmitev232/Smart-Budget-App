import pool from '../../config/database';
import { SUBSCRIPTION_TIERS, SubscriptionTierName, getDailyLimit } from '../../config/subscriptions';

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
}

export interface QuotaStatus {
  tier: SubscriptionTierName;
  aiInsights: QuotaCheckResult;
  billComparisons: QuotaCheckResult;
}

export interface User {
  id: number;
  email: string;
  subscription_tier: SubscriptionTierName;
}

export type RequestType = 'ai_insight' | 'bill_comparison';

export class QuotaService {
  /**
   * Get user with subscription tier from database
   */
  private async getUserWithTier(userId: number): Promise<User> {
    const query = `
      SELECT id, email, subscription_tier
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    return result.rows[0] as User;
  }

  /**
   * Get timestamp of oldest request for reset calculation
   */
  private async getOldestRequestTimestamp(
    userId: number,
    requestType: RequestType
  ): Promise<Date | null> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const query = `
      SELECT request_timestamp
      FROM user_requests
      WHERE user_id = $1
        AND request_type = $2
        AND request_timestamp > $3
      ORDER BY request_timestamp ASC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId, requestType, twentyFourHoursAgo]);

    if (result.rows.length === 0) {
      return null;
    }

    // Reset time = oldest request + 24 hours
    const oldestTimestamp = new Date(result.rows[0].request_timestamp);
    const resetAt = new Date(oldestTimestamp.getTime() + 24 * 60 * 60 * 1000);

    return resetAt;
  }

  /**
   * Check if user has available quota for request type
   */
  async checkQuota(userId: number, requestType: RequestType): Promise<QuotaCheckResult> {
    const user = await this.getUserWithTier(userId);
    const dailyLimit = getDailyLimit(user.subscription_tier, requestType);

    // Unlimited for pro tier (-1 means unlimited)
    if (dailyLimit === -1) {
      return { allowed: true, remaining: -1, resetAt: null };
    }

    // Count requests in last 24 hours (rolling window)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const countQuery = `
      SELECT COUNT(*) as count
      FROM user_requests
      WHERE user_id = $1
        AND request_type = $2
        AND request_timestamp > $3
    `;

    const result = await pool.query(countQuery, [userId, requestType, twentyFourHoursAgo]);
    const count = parseInt(result.rows[0].count);
    const remaining = dailyLimit - count;

    // Get reset time (when oldest request expires)
    const resetAt = await this.getOldestRequestTimestamp(userId, requestType);

    return {
      allowed: remaining > 0,
      remaining: Math.max(0, remaining),
      resetAt,
    };
  }

  /**
   * Log a request after successful completion
   */
  async logRequest(
    userId: number,
    requestType: RequestType,
    provider: string,
    tokensUsed?: number
  ): Promise<void> {
    const query = `
      INSERT INTO user_requests (user_id, request_type, provider, tokens_used)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(query, [userId, requestType, provider, tokensUsed || null]);
  }

  /**
   * Get quota status for user (for UI display)
   */
  async getQuotaStatus(userId: number): Promise<QuotaStatus> {
    const user = await this.getUserWithTier(userId);
    const aiQuota = await this.checkQuota(userId, 'ai_insight');
    const billQuota = await this.checkQuota(userId, 'bill_comparison');

    return {
      tier: user.subscription_tier,
      aiInsights: aiQuota,
      billComparisons: billQuota,
    };
  }

  /**
   * Clean up old request records (older than 30 days)
   * Should be run as a scheduled job
   */
  async cleanupOldRequests(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const query = `
      DELETE FROM user_requests
      WHERE created_at < $1
    `;

    const result = await pool.query(query, [thirtyDaysAgo]);
    return result.rowCount || 0;
  }
}

// Export singleton instance
export const quotaService = new QuotaService();
