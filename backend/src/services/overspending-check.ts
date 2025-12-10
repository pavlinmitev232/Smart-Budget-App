import pool from '../config/database';
import { aiService } from './ai.service';

interface Alert {
  id: number;
  alert_type: string;
  severity: string;
  message: string;
  ai_suggestion: string | null;
}

/**
 * Check if a user is overspending based on their income profile
 * and create alerts if thresholds are exceeded
 */
export async function checkOverspendingForUser(userId: number): Promise<Alert[]> {
  const createdAlerts: Alert[] = [];

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 1: Fetch income profile
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const incomeResult = await pool.query(
      `SELECT normalized_monthly_income, primary_income_source
       FROM user_income_profile
       WHERE user_id = $1`,
      [userId]
    );

    // If no income profile, skip alert check
    if (incomeResult.rows.length === 0) {
      console.log(`[OVERSPENDING] User ${userId} has no income profile, skipping check`);
      return createdAlerts;
    }

    const monthlyIncome = parseFloat(incomeResult.rows[0].normalized_monthly_income);
    const incomeSource = incomeResult.rows[0].primary_income_source;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 2: Calculate current month expenses
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expensesResult = await pool.query(
      `SELECT
         SUM(amount) as total_expenses,
         category,
         SUM(amount) as category_total
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date >= $2
         AND date <= $3
       GROUP BY category
       ORDER BY category_total DESC`,
      [userId, firstDayOfMonth.toISOString(), lastDayOfMonth.toISOString()]
    );

    const totalExpenses = expensesResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.category_total),
      0
    );

    const topCategory = expensesResult.rows.length > 0 ? expensesResult.rows[0] : null;

    console.log(`[OVERSPENDING] User ${userId}: Income=$${monthlyIncome}, Expenses=$${totalExpenses}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STEP 3: Check alert thresholds and create alerts
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const spendingPercentage = (totalExpenses / monthlyIncome) * 100;

    // Threshold 1: Expenses > 90% of income (Warning)
    if (spendingPercentage >= 90 && spendingPercentage < 100) {
      const alert = await createAlert(
        userId,
        'overspending_90',
        'warning',
        `⚠️ You've spent $${totalExpenses.toFixed(2)} of your $${monthlyIncome.toFixed(2)} monthly income (${spendingPercentage.toFixed(1)}%).`
      );
      if (alert) createdAlerts.push(alert);
    }

    // Threshold 2: Expenses > 100% of income (Critical)
    if (spendingPercentage >= 100) {
      const overage = totalExpenses - monthlyIncome;
      const alert = await createAlert(
        userId,
        'overspending_100',
        'critical',
        `🚨 Critical: You've overspent by $${overage.toFixed(2)}! Total expenses: $${totalExpenses.toFixed(2)}, Income: $${monthlyIncome.toFixed(2)}.`
      );
      if (alert) createdAlerts.push(alert);
    }

    // Threshold 3: Negative balance for 2+ consecutive months
    const negativeBalanceMonths = await checkConsecutiveNegativeBalance(userId);
    if (negativeBalanceMonths >= 2) {
      const alert = await createAlert(
        userId,
        'negative_balance',
        'critical',
        `🚨 You've had negative balance for ${negativeBalanceMonths} consecutive months. Immediate action required.`
      );
      if (alert) createdAlerts.push(alert);
    }

    return createdAlerts;
  } catch (error) {
    console.error(`[OVERSPENDING] Error checking overspending for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create an alert without AI suggestion (on-demand only)
 */
async function createAlert(
  userId: number,
  alertType: string,
  severity: string,
  message: string
): Promise<Alert | null> {
  try {
    // Check if alert already exists today (prevent duplicates)
    const existingAlert = await pool.query(
      `SELECT id FROM user_alerts
       WHERE user_id = $1
         AND alert_type = $2
         AND created_at::date = CURRENT_DATE`,
      [userId, alertType]
    );

    if (existingAlert.rows.length > 0) {
      console.log(`[OVERSPENDING] Alert ${alertType} already exists for user ${userId} today`);
      return null;
    }

    // Create alert WITHOUT AI suggestion (to be generated on-demand)
    const result = await pool.query(
      `INSERT INTO user_alerts (user_id, alert_type, severity, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, alertType, severity, message]
    );

    console.log(`[OVERSPENDING] Created ${severity} alert for user ${userId}: ${alertType}`);

    return result.rows[0];
  } catch (error) {
    console.error('[OVERSPENDING] Error creating alert:', error);
    return null;
  }
}

/**
 * Generate AI-powered savings suggestion for a specific alert
 * This is called on-demand when user requests AI help
 */
export async function generateAlertSuggestion(
  userId: number,
  alertId: number
): Promise<string> {
  try {
    // Fetch alert details
    const alertResult = await pool.query(
      `SELECT alert_type, severity, message FROM user_alerts WHERE id = $1 AND user_id = $2`,
      [alertId, userId]
    );

    if (alertResult.rows.length === 0) {
      throw new Error('Alert not found');
    }

    const alert = alertResult.rows[0];

    // Fetch income profile
    const incomeResult = await pool.query(
      `SELECT normalized_monthly_income FROM user_income_profile WHERE user_id = $1`,
      [userId]
    );

    const monthlyIncome = incomeResult.rows.length > 0
      ? parseFloat(incomeResult.rows[0].normalized_monthly_income)
      : 0;

    // Fetch current month expenses
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expensesResult = await pool.query(
      `SELECT
         category,
         SUM(amount) as category_total
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date >= $2
         AND date <= $3
       GROUP BY category
       ORDER BY category_total DESC
       LIMIT 1`,
      [userId, firstDayOfMonth.toISOString(), lastDayOfMonth.toISOString()]
    );

    const totalExpensesResult = await pool.query(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND date >= $2 AND date <= $3`,
      [userId, firstDayOfMonth.toISOString(), lastDayOfMonth.toISOString()]
    );

    const totalExpenses = totalExpensesResult.rows[0]?.total
      ? parseFloat(totalExpensesResult.rows[0].total)
      : 0;

    const topCategory = expensesResult.rows.length > 0 ? expensesResult.rows[0] : null;
    const overage = totalExpenses - monthlyIncome;
    const targetReduction = alert.severity === 'critical'
      ? overage + monthlyIncome * 0.2
      : monthlyIncome * 0.1;

    const prompt = `You are a financial advisor. Generate a brief, actionable suggestion (2-3 sentences max) to help a user reduce their monthly expenses.

Context:
- Monthly Income: $${monthlyIncome.toFixed(2)}
- Current Expenses: $${totalExpenses.toFixed(2)}
- Top Spending Category: ${topCategory?.category || 'Unknown'} ($${parseFloat(topCategory?.category_total || 0).toFixed(2)})
- Alert Severity: ${alert.severity}
- Target Reduction: $${targetReduction.toFixed(2)}

Provide a specific, practical recommendation focused on the top spending category.`;

    const aiInstance = aiService.getInstance();

    if (aiInstance.isGeminiAvailable()) {
      const result = await aiService.analyzeWithGemini(
        'You are a helpful financial advisor providing brief, actionable advice.',
        prompt
      );
      return result.insights;
    } else {
      // Fallback suggestion
      return `Consider reducing spending in ${topCategory?.category || 'non-essential categories'} by $${targetReduction.toFixed(2)}/month to stay on track.`;
    }
  } catch (error) {
    console.error('[OVERSPENDING] Error generating AI suggestion:', error);
    throw error;
  }
}

/**
 * Check for consecutive months with negative balance
 */
async function checkConsecutiveNegativeBalance(userId: number): Promise<number> {
  try {
    // Get last 6 months of transaction data
    const result = await pool.query(
      `WITH monthly_balance AS (
         SELECT
           DATE_TRUNC('month', date) as month,
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
           SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance
         FROM transactions
         WHERE user_id = $1
           AND date >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', date)
         ORDER BY month DESC
       )
       SELECT month, net_balance
       FROM monthly_balance`,
      [userId]
    );

    let consecutiveNegative = 0;
    for (const row of result.rows) {
      const balance = parseFloat(row.net_balance);
      if (balance < 0) {
        consecutiveNegative++;
      } else {
        break; // Stop counting when we hit a positive month
      }
    }

    return consecutiveNegative;
  } catch (error) {
    console.error('[OVERSPENDING] Error checking negative balance:', error);
    return 0;
  }
}

/**
 * Run overspending check for all users with income profiles
 */
export async function checkAllUsersOverspending(): Promise<void> {
  try {
    console.log('[OVERSPENDING] Starting daily overspending check for all users');

    const usersResult = await pool.query(
      `SELECT DISTINCT user_id FROM user_income_profile`
    );

    const users = usersResult.rows;
    console.log(`[OVERSPENDING] Checking ${users.length} users with income profiles`);

    for (const user of users) {
      try {
        const alerts = await checkOverspendingForUser(user.user_id);
        if (alerts.length > 0) {
          console.log(`[OVERSPENDING] Created ${alerts.length} alert(s) for user ${user.user_id}`);
        }
      } catch (error) {
        console.error(`[OVERSPENDING] Error checking user ${user.user_id}:`, error);
        // Continue with next user
      }
    }

    console.log('[OVERSPENDING] Daily overspending check completed');
  } catch (error) {
    console.error('[OVERSPENDING] Error in daily check:', error);
    throw error;
  }
}
