import pool from '../../config/database';
import { Goal } from './goals.types';

/**
 * Timeline projection data for a goal
 */
export interface TimelineProjection {
  goalId: number;
  goalName: string;
  monthsToGoal: number | null;
  projectedCompletion: string | null;
  monthlySavingsNeeded: number;
  availableForSavings: number;
  previousProjectedCompletion: string | null;
  timelineChangeMonths: number | null;
  reason: string | null;
}

/**
 * Savings capacity calculation result
 */
export interface SavingsCapacity {
  monthlyIncome: number;
  avgMonthlyExpenses: number;
  availableForSavings: number;
  hasIncomeProfile: boolean;
}

/**
 * Expense change detection result
 */
export interface ExpenseChangeResult {
  currentMonthExpenses: number;
  previousMonthExpenses: number;
  percentageChange: number;
  isSignificantChange: boolean;
  direction: 'increase' | 'decrease' | 'stable';
}

/**
 * Timeline notification data
 */
export interface TimelineNotification {
  goalId: number;
  goalName: string;
  type: 'improvement' | 'worsening';
  changeMonths: number;
  previousDate: string;
  newDate: string;
  reason: string;
  aiSuggestion?: string;
}

/**
 * Timeline Service
 * Handles timeline calculations and projections for financial goals
 */
export const timelineService = {
  /**
   * Calculate savings capacity for a user
   * Uses normalized monthly income from income profile and average expenses from last 3 months
   */
  calculateSavingsCapacity: async (userId: number): Promise<SavingsCapacity> => {
    // Get normalized monthly income from income profile
    const incomeResult = await pool.query(
      `SELECT normalized_monthly_income
       FROM user_income_profile
       WHERE user_id = $1`,
      [userId]
    );

    const hasIncomeProfile = incomeResult.rows.length > 0;
    const monthlyIncome = hasIncomeProfile
      ? parseFloat(incomeResult.rows[0].normalized_monthly_income)
      : 0;

    // Calculate average monthly expenses from last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startDate = threeMonthsAgo.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const expenseResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_expenses,
              COUNT(DISTINCT DATE_TRUNC('month', date)) as months_with_data
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date >= $2
         AND date <= $3`,
      [userId, startDate, endDate]
    );

    const totalExpenses = parseFloat(expenseResult.rows[0].total_expenses) || 0;
    const monthsWithData = parseInt(expenseResult.rows[0].months_with_data) || 1;
    const avgMonthlyExpenses = totalExpenses / Math.max(monthsWithData, 1);

    const availableForSavings = Math.max(0, monthlyIncome - avgMonthlyExpenses);

    return {
      monthlyIncome,
      avgMonthlyExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
      availableForSavings: Math.round(availableForSavings * 100) / 100,
      hasIncomeProfile,
    };
  },

  /**
   * Detect significant expense pattern changes (±20% month-over-month)
   */
  detectExpenseChange: async (userId: number): Promise<ExpenseChangeResult> => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month expenses (up to today)
    const currentResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date >= $2`,
      [userId, currentMonthStart.toISOString().split('T')[0]]
    );

    // Get previous month expenses
    const previousResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date >= $2
         AND date <= $3`,
      [userId, previousMonthStart.toISOString().split('T')[0], previousMonthEnd.toISOString().split('T')[0]]
    );

    const currentMonthExpenses = parseFloat(currentResult.rows[0].total) || 0;
    const previousMonthExpenses = parseFloat(previousResult.rows[0].total) || 0;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousMonthExpenses > 0) {
      percentageChange = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
    }

    const isSignificantChange = Math.abs(percentageChange) >= 20;
    let direction: 'increase' | 'decrease' | 'stable' = 'stable';
    if (percentageChange >= 20) {
      direction = 'increase';
    } else if (percentageChange <= -20) {
      direction = 'decrease';
    }

    return {
      currentMonthExpenses: Math.round(currentMonthExpenses * 100) / 100,
      previousMonthExpenses: Math.round(previousMonthExpenses * 100) / 100,
      percentageChange: Math.round(percentageChange * 10) / 10,
      isSignificantChange,
      direction,
    };
  },

  /**
   * Calculate timeline projection for a single goal
   */
  calculateGoalProjection: (
    goal: Goal,
    savingsCapacity: SavingsCapacity,
    previousProjection?: { projectedCompletion: string | null }
  ): TimelineProjection => {
    const targetAmount = parseFloat(goal.targetAmount);
    const currentAmount = parseFloat(goal.currentAmount);
    const remainingAmount = targetAmount - currentAmount;

    // Calculate monthly savings needed (based on deadline if set)
    let monthlySavingsNeeded = 0;
    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const monthsUntilDeadline = Math.max(1,
        (deadline.getFullYear() - now.getFullYear()) * 12 +
        (deadline.getMonth() - now.getMonth())
      );
      monthlySavingsNeeded = remainingAmount / monthsUntilDeadline;
    } else if (savingsCapacity.availableForSavings > 0) {
      // Without deadline, show what's needed at current savings rate
      monthlySavingsNeeded = savingsCapacity.availableForSavings;
    }

    // Calculate months to goal based on available savings
    let monthsToGoal: number | null = null;
    let projectedCompletion: string | null = null;

    if (savingsCapacity.availableForSavings > 0 && remainingAmount > 0) {
      monthsToGoal = Math.ceil(remainingAmount / savingsCapacity.availableForSavings);
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + monthsToGoal);
      projectedCompletion = projectedDate.toISOString().split('T')[0];
    } else if (remainingAmount <= 0) {
      // Goal already completed
      monthsToGoal = 0;
      projectedCompletion = new Date().toISOString().split('T')[0];
    }

    // Calculate timeline change
    let timelineChangeMonths: number | null = null;
    let reason: string | null = null;

    if (previousProjection?.projectedCompletion && projectedCompletion) {
      const prevDate = new Date(previousProjection.projectedCompletion);
      const newDate = new Date(projectedCompletion);
      timelineChangeMonths = Math.round(
        (newDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      if (timelineChangeMonths < 0) {
        reason = 'Income increased or expenses decreased';
      } else if (timelineChangeMonths > 0) {
        reason = 'Expenses increased or income decreased';
      }
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      monthsToGoal,
      projectedCompletion,
      monthlySavingsNeeded: Math.round(monthlySavingsNeeded * 100) / 100,
      availableForSavings: savingsCapacity.availableForSavings,
      previousProjectedCompletion: previousProjection?.projectedCompletion || null,
      timelineChangeMonths,
      reason,
    };
  },

  /**
   * Recalculate timelines for all active goals of a user
   * Returns notifications for significant changes
   */
  recalculateUserTimelines: async (
    userId: number,
    previousProjections?: Map<number, { projectedCompletion: string | null }>
  ): Promise<{
    projections: TimelineProjection[];
    notifications: TimelineNotification[];
    savingsCapacity: SavingsCapacity;
  }> => {
    // Get savings capacity
    const savingsCapacity = await timelineService.calculateSavingsCapacity(userId);

    // Get all active goals
    const goalsResult = await pool.query(
      `SELECT * FROM goals WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    const projections: TimelineProjection[] = [];
    const notifications: TimelineNotification[] = [];

    for (const row of goalsResult.rows) {
      const goal: Goal = {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        goalType: row.goal_type,
        targetAmount: row.target_amount,
        currentAmount: row.current_amount,
        deadline: row.deadline ? row.deadline.toISOString().split('T')[0] : null,
        priority: row.priority,
        status: row.status,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        progressPercentage: 0,
        remainingAmount: '0',
        isCompleted: false,
      };

      const prevProjection = previousProjections?.get(goal.id);
      const projection = timelineService.calculateGoalProjection(goal, savingsCapacity, prevProjection);
      projections.push(projection);

      // Create notification if timeline changed significantly (> 1 month)
      if (projection.timelineChangeMonths !== null && Math.abs(projection.timelineChangeMonths) > 1) {
        const notification: TimelineNotification = {
          goalId: goal.id,
          goalName: goal.name,
          type: projection.timelineChangeMonths < 0 ? 'improvement' : 'worsening',
          changeMonths: Math.abs(projection.timelineChangeMonths),
          previousDate: projection.previousProjectedCompletion || '',
          newDate: projection.projectedCompletion || '',
          reason: projection.reason || '',
        };

        // Add AI suggestion for worsening timelines
        if (notification.type === 'worsening') {
          notification.aiSuggestion = await timelineService.generateAISuggestion(userId, goal, savingsCapacity);
        }

        notifications.push(notification);
      }
    }

    return { projections, notifications, savingsCapacity };
  },

  /**
   * Generate AI suggestion for getting back on track
   */
  generateAISuggestion: async (
    userId: number,
    goal: Goal,
    savingsCapacity: SavingsCapacity
  ): Promise<string> => {
    // Get top expense categories from last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const startDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    const categoryResult = await pool.query(
      `SELECT category, SUM(amount) as total
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date >= $2
         AND date <= $3
       GROUP BY category
       ORDER BY total DESC
       LIMIT 3`,
      [userId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    if (categoryResult.rows.length === 0) {
      return 'Track your expenses to get personalized savings suggestions.';
    }

    const topCategory = categoryResult.rows[0];
    const targetAmount = parseFloat(goal.targetAmount);
    const currentAmount = parseFloat(goal.currentAmount);
    const remaining = targetAmount - currentAmount;

    // Calculate how much to reduce to meet goal
    const neededMonthly = goal.deadline
      ? remaining / Math.max(1, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
      : savingsCapacity.availableForSavings + 100;

    const reductionNeeded = Math.max(0, neededMonthly - savingsCapacity.availableForSavings);
    const suggestedReduction = Math.min(reductionNeeded, parseFloat(topCategory.total) * 0.2);

    return `Reduce "${topCategory.category}" by $${Math.round(suggestedReduction)}/month to get back on track.`;
  },

  /**
   * Store timeline snapshot for a goal (for trend analysis)
   */
  storeTimelineSnapshot: async (
    goalId: number,
    projection: TimelineProjection
  ): Promise<void> => {
    await pool.query(
      `INSERT INTO goal_timeline_snapshots (
        goal_id,
        projected_completion,
        months_to_goal,
        available_for_savings,
        snapshot_date
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (goal_id, snapshot_date)
      DO UPDATE SET
        projected_completion = EXCLUDED.projected_completion,
        months_to_goal = EXCLUDED.months_to_goal,
        available_for_savings = EXCLUDED.available_for_savings`,
      [
        goalId,
        projection.projectedCompletion,
        projection.monthsToGoal,
        projection.availableForSavings,
      ]
    );
  },

  /**
   * Get previous timeline projection for a goal
   */
  getPreviousProjection: async (
    goalId: number
  ): Promise<{ projectedCompletion: string | null } | null> => {
    const result = await pool.query(
      `SELECT projected_completion
       FROM goal_timeline_snapshots
       WHERE goal_id = $1
       ORDER BY snapshot_date DESC
       LIMIT 1`,
      [goalId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      projectedCompletion: result.rows[0].projected_completion,
    };
  },
};
