import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { goalsService } from './goals.service';
import { sendSuccess, sendError } from '../../utils/response';
import { CreateGoalDto, UpdateGoalDto, AllocateGoalDto, GetGoalsQuery } from './goals.types';
import pool from '../../config/database';
import { SubscriptionTierName } from '../../config/subscriptions';

/**
 * Tier-based goal limits
 */
const GOAL_LIMITS = {
  free: 3,
  basic: 10,
  pro: Infinity,
};

/**
 * Get user's subscription tier
 */
async function getUserTier(userId: number): Promise<SubscriptionTierName> {
  const query = 'SELECT subscription_tier FROM users WHERE id = $1';
  const result = await pool.query(query, [userId]);
  return result.rows[0]?.subscription_tier || 'free';
}

/**
 * Goals Controller
 * HTTP request handlers for goal endpoints
 */
export const goalsController = {
  /**
   * GET /api/goals
   * Get all goals for the authenticated user
   */
  getGoals: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters: GetGoalsQuery = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      };

      const goals = await goalsService.getGoals(userId, filters);

      return sendSuccess(res, {
        goals,
        count: goals.length,
      });
    } catch (error) {
      console.error('Get goals error:', error);
      return sendError(res, 'Failed to fetch goals', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/goals/:id
   * Get a single goal by ID
   */
  getGoalById: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const goalId = parseInt(req.params.id, 10);

      if (isNaN(goalId)) {
        return sendError(res, 'Invalid goal ID', 'INVALID_INPUT', 400);
      }

      const goal = await goalsService.getGoalById(userId, goalId);

      if (!goal) {
        return sendError(res, 'Goal not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, { goal });
    } catch (error) {
      console.error('Get goal by ID error:', error);
      return sendError(res, 'Failed to fetch goal', 'SERVER_ERROR', 500);
    }
  },

  /**
   * POST /api/goals
   * Create a new goal
   */
  createGoal: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const data: CreateGoalDto = req.body;

      // Check tier-based goal limits
      const tier = await getUserTier(userId);
      const limit = GOAL_LIMITS[tier];
      const activeGoalsCount = await goalsService.countActiveGoals(userId);

      if (activeGoalsCount >= limit) {
        const upgradeMessage =
          tier === 'free'
            ? 'Upgrade to Basic for 10 goals or Pro for unlimited goals'
            : tier === 'basic'
            ? 'Upgrade to Pro for unlimited goals'
            : '';

        return sendError(
          res,
          `Goal limit reached. ${upgradeMessage}`,
          'TIER_LIMIT_EXCEEDED',
          403,
          {
            currentTier: tier,
            limit,
            activeGoals: activeGoalsCount,
          }
        );
      }

      const goal = await goalsService.createGoal(userId, data);

      return sendSuccess(
        res,
        {
          goal,
          message: 'Goal created successfully',
        },
        201
      );
    } catch (error) {
      console.error('Create goal error:', error);
      return sendError(res, 'Failed to create goal', 'SERVER_ERROR', 500);
    }
  },

  /**
   * PUT /api/goals/:id
   * Update an existing goal
   */
  updateGoal: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const goalId = parseInt(req.params.id, 10);
      const data: UpdateGoalDto = req.body;

      if (isNaN(goalId)) {
        return sendError(res, 'Invalid goal ID', 'INVALID_INPUT', 400);
      }

      const goal = await goalsService.updateGoal(userId, goalId, data);

      if (!goal) {
        return sendError(res, 'Goal not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, {
        goal,
        message: 'Goal updated successfully',
      });
    } catch (error) {
      console.error('Update goal error:', error);
      return sendError(res, 'Failed to update goal', 'SERVER_ERROR', 500);
    }
  },

  /**
   * DELETE /api/goals/:id
   * Delete (archive) a goal
   */
  deleteGoal: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const goalId = parseInt(req.params.id, 10);

      if (isNaN(goalId)) {
        return sendError(res, 'Invalid goal ID', 'INVALID_INPUT', 400);
      }

      const deleted = await goalsService.deleteGoal(userId, goalId);

      if (!deleted) {
        return sendError(res, 'Goal not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, {
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      console.error('Delete goal error:', error);
      return sendError(res, 'Failed to delete goal', 'SERVER_ERROR', 500);
    }
  },

  /**
   * POST /api/goals/:id/allocate
   * Allocate money to a goal
   */
  allocateToGoal: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const goalId = parseInt(req.params.id, 10);
      const data: AllocateGoalDto = req.body;

      if (isNaN(goalId)) {
        return sendError(res, 'Invalid goal ID', 'INVALID_INPUT', 400);
      }

      const goal = await goalsService.allocateToGoal(userId, goalId, data);

      if (!goal) {
        return sendError(res, 'Goal not found', 'NOT_FOUND', 404);
      }

      const isCompleted = goal.status === 'completed';

      return sendSuccess(res, {
        goal,
        message: isCompleted
          ? `Congratulations! Goal "${goal.name}" completed!`
          : 'Amount allocated to goal successfully',
        completed: isCompleted,
      });
    } catch (error: any) {
      console.error('Allocate to goal error:', error);

      if (error.message === 'Allocation amount exceeds remaining target amount') {
        return sendError(res, error.message, 'VALIDATION_ERROR', 400);
      }

      return sendError(res, 'Failed to allocate to goal', 'SERVER_ERROR', 500);
    }
  },
};
