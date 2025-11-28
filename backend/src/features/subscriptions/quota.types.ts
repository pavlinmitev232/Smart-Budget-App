import { QuotaCheckResult } from './quota.service';

/**
 * Error response for quota exceeded
 */
export interface QuotaExceededError {
  success: false;
  error: {
    code: 'QUOTA_EXCEEDED';
    message: string;
    quotaStatus: {
      used: number;
      limit: number;
      resetAt: string | null;
    };
  };
}

/**
 * Successful response with quota info
 */
export interface SuccessWithQuota<T = any> {
  success: true;
  data: T;
  quotaStatus: {
    remaining: number;
    limit: number;
    resetAt: string | null;
  };
}

/**
 * Helper to format quota exceeded error response
 */
export function formatQuotaExceededError(
  requestType: 'ai_insight' | 'bill_comparison',
  used: number,
  limit: number,
  resetAt: Date | null
): QuotaExceededError {
  const requestTypeLabel = requestType === 'ai_insight' ? 'AI insight' : 'bill comparison';

  return {
    success: false,
    error: {
      code: 'QUOTA_EXCEEDED',
      message: `Daily ${requestTypeLabel} limit reached (${used}/${limit}). Upgrade to Basic for ${
        requestType === 'ai_insight' ? '50/day' : '10/day'
      } or Pro for unlimited.`,
      quotaStatus: {
        used,
        limit,
        resetAt: resetAt ? resetAt.toISOString() : null,
      },
    },
  };
}

/**
 * Helper to format success response with quota info
 */
export function formatSuccessWithQuota<T>(
  data: T,
  quota: QuotaCheckResult,
  limit: number
): SuccessWithQuota<T> {
  return {
    success: true,
    data,
    quotaStatus: {
      remaining: quota.remaining,
      limit,
      resetAt: quota.resetAt ? quota.resetAt.toISOString() : null,
    },
  };
}
