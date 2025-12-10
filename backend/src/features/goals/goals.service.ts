import pool from '../../config/database';
import {
  CreateGoalDto,
  UpdateGoalDto,
  AllocateGoalDto,
  Goal,
  GetGoalsQuery,
  GoalType,
  GoalPriority,
  GoalStatus,
} from './goals.types';

/**
 * Database row structure (snake_case)
 */
interface GoalRow {
  id: number;
  user_id: number;
  name: string;
  goal_type: GoalType;
  target_amount: string;
  current_amount: string;
  deadline: Date | null;
  priority: GoalPriority;
  status: GoalStatus;
  created_at: Date;
  updated_at: Date;
}

/**
 * Convert database row (snake_case) to camelCase Goal object with computed fields
 */
function mapRowToGoal(row: GoalRow): Goal {
  const targetAmount = parseFloat(row.target_amount);
  const currentAmount = parseFloat(row.current_amount);
  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const remainingAmount = (targetAmount - currentAmount).toFixed(2);
  const isCompleted = currentAmount >= targetAmount;

  return {
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
    progressPercentage: Math.round(progressPercentage * 10) / 10, // Round to 1 decimal
    remainingAmount,
    isCompleted,
  };
}

/**
 * Goal Service
 * Business logic for goal operations
 */
export const goalsService = {
  /**
   * Get all goals for a user with optional filtering
   * @param userId - ID of the authenticated user
   * @param filters - Optional filters (status, priority, sorting)
   * @returns Array of goals
   */
  getGoals: async (userId: number, filters: GetGoalsQuery = {}): Promise<Goal[]> => {
    const { status, priority, sortBy = 'priority', sortOrder = 'desc' } = filters;

    let query = 'SELECT * FROM goals WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    // Apply sorting
    const sortColumn = sortBy === 'progress' ? 'current_amount' : sortBy;
    query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;

    const result = await pool.query<GoalRow>(query, params);
    return result.rows.map(mapRowToGoal);
  },

  /**
   * Get a single goal by ID
   * @param userId - ID of the authenticated user
   * @param goalId - ID of the goal
   * @returns Goal or null if not found
   */
  getGoalById: async (userId: number, goalId: number): Promise<Goal | null> => {
    const query = 'SELECT * FROM goals WHERE id = $1 AND user_id = $2';
    const result = await pool.query<GoalRow>(query, [goalId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapRowToGoal(result.rows[0]);
  },

  /**
   * Count active goals for a user (for tier limit enforcement)
   * @param userId - ID of the authenticated user
   * @returns Count of active goals
   */
  countActiveGoals: async (userId: number): Promise<number> => {
    const query = `
      SELECT COUNT(*) as count
      FROM goals
      WHERE user_id = $1 AND status = 'active'
    `;
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Create a new goal for a user
   * @param userId - ID of the authenticated user
   * @param data - Goal data
   * @returns Created goal
   */
  createGoal: async (userId: number, data: CreateGoalDto): Promise<Goal> => {
    const {
      name,
      goal_type,
      target_amount,
      current_amount = 0,
      deadline,
      priority = 'medium',
    } = data;

    const query = `
      INSERT INTO goals (
        user_id,
        name,
        goal_type,
        target_amount,
        current_amount,
        deadline,
        priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      name,
      goal_type,
      target_amount,
      current_amount,
      deadline || null,
      priority,
    ];

    const result = await pool.query<GoalRow>(query, values);
    return mapRowToGoal(result.rows[0]);
  },

  /**
   * Update an existing goal
   * @param userId - ID of the authenticated user
   * @param goalId - ID of the goal to update
   * @param data - Updated goal data
   * @returns Updated goal or null if not found
   */
  updateGoal: async (
    userId: number,
    goalId: number,
    data: UpdateGoalDto
  ): Promise<Goal | null> => {
    const allowedFields = [
      'name',
      'goal_type',
      'target_amount',
      'current_amount',
      'deadline',
      'priority',
      'status',
    ];
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      // No valid fields to update
      return goalsService.getGoalById(userId, goalId);
    }

    values.push(goalId, userId);

    const query = `
      UPDATE goals
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query<GoalRow>(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const updatedGoal = mapRowToGoal(result.rows[0]);

    // If target_amount was updated and goal is completed, check if it should remain completed
    if (data.target_amount !== undefined && updatedGoal.status === 'completed') {
      const currentAmount = parseFloat(updatedGoal.currentAmount);
      const targetAmount = parseFloat(updatedGoal.targetAmount);

      // If current amount is now less than target, move back to active
      if (currentAmount < targetAmount) {
        const statusUpdateQuery = `
          UPDATE goals
          SET status = 'active'
          WHERE id = $1 AND user_id = $2
          RETURNING *
        `;
        const statusResult = await pool.query<GoalRow>(statusUpdateQuery, [goalId, userId]);
        return mapRowToGoal(statusResult.rows[0]);
      }
    }

    return updatedGoal;
  },

  /**
   * Delete a goal (soft delete by setting status to 'archived')
   * @param userId - ID of the authenticated user
   * @param goalId - ID of the goal to delete
   * @returns True if deleted, false if not found
   */
  deleteGoal: async (userId: number, goalId: number): Promise<boolean> => {
    const query = `
      UPDATE goals
      SET status = 'archived'
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [goalId, userId]);
    return result.rows.length > 0;
  },

  /**
   * Allocate money to a goal
   * @param userId - ID of the authenticated user
   * @param goalId - ID of the goal
   * @param data - Allocation amount and optional notes
   * @returns Updated goal or null if not found
   */
  allocateToGoal: async (
    userId: number,
    goalId: number,
    data: AllocateGoalDto
  ): Promise<Goal | null> => {
    const { amount } = data;

    // Get current goal
    const goal = await goalsService.getGoalById(userId, goalId);
    if (!goal) {
      return null;
    }

    const newCurrentAmount = parseFloat(goal.currentAmount) + amount;
    const targetAmount = parseFloat(goal.targetAmount);

    // Check if allocation exceeds target
    if (newCurrentAmount > targetAmount) {
      throw new Error('Allocation amount exceeds remaining target amount');
    }

    // Update current amount
    const updateData: UpdateGoalDto = {
      current_amount: newCurrentAmount,
    };

    // Auto-complete goal if target reached
    if (newCurrentAmount >= targetAmount) {
      updateData.status = 'completed';
    }

    return goalsService.updateGoal(userId, goalId, updateData);
  },
};
