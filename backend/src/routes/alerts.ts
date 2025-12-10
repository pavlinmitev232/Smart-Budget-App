import express, { Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { sendError, sendSuccess } from '../utils/response';

const router = express.Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/alerts - Get user's alerts (unread or all)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { unreadOnly = 'true' } = req.query;

    let query = `
      SELECT id, alert_type, severity, message, ai_suggestion, is_read, dismissed_at, created_at
      FROM user_alerts
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    // Filter for unread and not dismissed alerts
    if (unreadOnly === 'true') {
      query += ` AND is_read = false AND dismissed_at IS NULL`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    return sendSuccess(res, {
      alerts: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('[ALERTS] Error fetching alerts:', error);
    return sendError(res, 'Failed to fetch alerts', 'FETCH_FAILED');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/alerts/:id/read - Mark alert as read
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.patch('/:id/read', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const alertId = parseInt(req.params.id);

    if (isNaN(alertId)) {
      return sendError(res, 'Invalid alert ID', 'INVALID_ALERT_ID', 400);
    }

    const result = await pool.query(
      `UPDATE user_alerts
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [alertId, userId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Alert not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, {
      message: 'Alert marked as read',
      alert: result.rows[0],
    });
  } catch (error: any) {
    console.error('[ALERTS] Error marking alert as read:', error);
    return sendError(res, 'Failed to update alert', 'UPDATE_FAILED');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PATCH /api/alerts/:id/dismiss - Dismiss alert
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.patch('/:id/dismiss', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const alertId = parseInt(req.params.id);

    if (isNaN(alertId)) {
      return sendError(res, 'Invalid alert ID', 'INVALID_ALERT_ID', 400);
    }

    const result = await pool.query(
      `UPDATE user_alerts
       SET dismissed_at = NOW(), is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [alertId, userId]
    );

    if (result.rows.length === 0) {
      return sendError(res, 'Alert not found', 'NOT_FOUND', 404);
    }

    return sendSuccess(res, {
      message: 'Alert dismissed',
      alert: result.rows[0],
    });
  } catch (error: any) {
    console.error('[ALERTS] Error dismissing alert:', error);
    return sendError(res, 'Failed to dismiss alert', 'DISMISS_FAILED');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/alerts/check - Manually trigger overspending check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Import the overspending detection logic
    const { checkOverspendingForUser } = await import('../services/overspending-check');

    const alerts = await checkOverspendingForUser(userId);

    return sendSuccess(res, {
      message: 'Overspending check completed',
      alertsCreated: alerts.length,
      alerts,
    });
  } catch (error: any) {
    console.error('[ALERTS] Error checking overspending:', error);
    return sendError(res, 'Failed to check overspending', 'CHECK_FAILED');
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/alerts/:id/ai-suggestion - Generate AI suggestion for alert
// Counts towards user's AI quota (unless unlimited plan)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

router.post('/:id/ai-suggestion', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const alertId = parseInt(req.params.id);

    if (isNaN(alertId)) {
      return sendError(res, 'Invalid alert ID', 'INVALID_ALERT_ID', 400);
    }

    // Check if alert already has AI suggestion
    const existingAlert = await pool.query(
      `SELECT ai_suggestion FROM user_alerts WHERE id = $1 AND user_id = $2`,
      [alertId, userId]
    );

    if (existingAlert.rows.length === 0) {
      return sendError(res, 'Alert not found', 'NOT_FOUND', 404);
    }

    if (existingAlert.rows[0].ai_suggestion) {
      // Already has suggestion, return it without generating new one
      return sendSuccess(res, {
        message: 'AI suggestion already exists',
        suggestion: existingAlert.rows[0].ai_suggestion,
        cached: true,
      });
    }

    // Check subscription tier and AI quota
    let tier = 'free';
    let aiRequestsUsed = 0;
    let aiLimits: any = { free: 5, basic: 20, pro: 50, unlimited: Infinity };

    try {
      const subscriptionResult = await pool.query(
        `SELECT tier, ai_requests_used, ai_requests_reset_at FROM user_subscriptions WHERE user_id = $1`,
        [userId]
      );

      if (subscriptionResult.rows.length > 0) {
        tier = subscriptionResult.rows[0].tier;
        aiRequestsUsed = subscriptionResult.rows[0].ai_requests_used || 0;
      }
    } catch (subscriptionError) {
      // If subscription table doesn't exist or user has no subscription, default to 'free'
      console.log('[ALERTS] No subscription found, defaulting to free tier');
    }

    // Check if user has quota remaining (unless unlimited)
    if (tier !== 'unlimited' && aiRequestsUsed >= aiLimits[tier]) {
      return sendError(
        res,
        'AI request quota exceeded. Upgrade your plan for more requests.',
        'QUOTA_EXCEEDED',
        403
      );
    }

    // Generate AI suggestion
    const { generateAlertSuggestion } = await import('../services/overspending-check');
    const suggestion = await generateAlertSuggestion(userId, alertId);

    // Save suggestion to alert
    await pool.query(
      `UPDATE user_alerts SET ai_suggestion = $1 WHERE id = $2`,
      [suggestion, alertId]
    );

    // Increment AI request counter (unless unlimited)
    if (tier !== 'unlimited') {
      try {
        await pool.query(
          `UPDATE user_subscriptions
           SET ai_requests_used = ai_requests_used + 1
           WHERE user_id = $1`,
          [userId]
        );
      } catch (updateError) {
        console.log('[ALERTS] Could not update AI request counter (subscription may not exist)');
      }
    }

    return sendSuccess(res, {
      message: 'AI suggestion generated',
      suggestion,
      cached: false,
      quotaStatus: {
        used: tier === 'unlimited' ? 0 : aiRequestsUsed + 1,
        limit: aiLimits[tier],
        remaining: tier === 'unlimited' ? Infinity : aiLimits[tier] - aiRequestsUsed - 1,
      },
    });
  } catch (error: any) {
    console.error('[ALERTS] Error generating AI suggestion:', error);
    return sendError(res, 'Failed to generate AI suggestion', 'AI_GENERATION_FAILED');
  }
});

export default router;
