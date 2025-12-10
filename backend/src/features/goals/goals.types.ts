/**
 * TypeScript type definitions for goals feature
 */

/**
 * Goal type - savings, purchase, or debt payoff
 */
export type GoalType = 'savings' | 'purchase' | 'debt_payoff';

/**
 * Goal priority level
 */
export type GoalPriority = 'high' | 'medium' | 'low';

/**
 * Goal status
 */
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

/**
 * Data Transfer Object for creating a new goal
 */
export interface CreateGoalDto {
  name: string;
  goal_type: GoalType;
  target_amount: number;
  current_amount?: number;
  deadline?: string; // YYYY-MM-DD format
  priority?: GoalPriority;
}

/**
 * Data Transfer Object for updating a goal
 */
export interface UpdateGoalDto {
  name?: string;
  goal_type?: GoalType;
  target_amount?: number;
  current_amount?: number;
  deadline?: string | null;
  priority?: GoalPriority;
  status?: GoalStatus;
}

/**
 * Data Transfer Object for allocating money to a goal
 */
export interface AllocateGoalDto {
  amount: number;
  notes?: string;
}

/**
 * Goal entity (matches database schema)
 */
export interface Goal {
  id: number;
  userId: number;
  name: string;
  goalType: GoalType;
  targetAmount: string; // Decimal stored as string for precision
  currentAmount: string; // Decimal stored as string for precision
  deadline: string | null; // ISO date string or null
  priority: GoalPriority;
  status: GoalStatus;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  // Computed fields
  progressPercentage: number;
  remainingAmount: string;
  isCompleted: boolean;
}

/**
 * Query parameters for filtering goals
 */
export interface GetGoalsQuery {
  status?: GoalStatus;
  priority?: GoalPriority;
  sortBy?: 'priority' | 'deadline' | 'progress' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}
