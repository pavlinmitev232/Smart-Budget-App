import { Request, Response, NextFunction } from 'express';
import { sendError } from '../../utils/response';

/**
 * Validation error structure
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate date format YYYY-MM-DD
 */
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate amount is positive number with max 2 decimal places
 */
function isValidAmount(amount: any): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  if (amount <= 0) {
    return false;
  }

  const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
  return decimalPlaces <= 2;
}

/**
 * Middleware to validate create goal request
 */
export const validateCreateGoal = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors: ValidationError[] = [];
  const { name, goal_type, target_amount, current_amount, deadline, priority } = req.body;

  // Validate name (required, 1-200 chars)
  if (!name) {
    errors.push({
      field: 'name',
      message: 'Goal name is required',
    });
  } else if (typeof name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Goal name must be a string',
    });
  } else if (name.length < 1 || name.length > 200) {
    errors.push({
      field: 'name',
      message: 'Goal name must be between 1 and 200 characters',
    });
  }

  // Validate goal_type (required)
  if (!goal_type) {
    errors.push({
      field: 'goal_type',
      message: 'Goal type is required',
    });
  } else if (!['savings', 'purchase', 'debt_payoff'].includes(goal_type)) {
    errors.push({
      field: 'goal_type',
      message: 'Goal type must be one of: savings, purchase, debt_payoff',
    });
  }

  // Validate target_amount (required, > 0)
  if (target_amount === undefined || target_amount === null) {
    errors.push({
      field: 'target_amount',
      message: 'Target amount is required',
    });
  } else if (!isValidAmount(target_amount)) {
    if (typeof target_amount !== 'number') {
      errors.push({
        field: 'target_amount',
        message: 'Target amount must be a number',
      });
    } else if (target_amount <= 0) {
      errors.push({
        field: 'target_amount',
        message: 'Target amount must be greater than 0',
      });
    } else {
      errors.push({
        field: 'target_amount',
        message: 'Target amount can have maximum 2 decimal places',
      });
    }
  }

  // Validate current_amount (optional, >= 0, <= target_amount)
  if (current_amount !== undefined && current_amount !== null) {
    if (typeof current_amount !== 'number' || isNaN(current_amount)) {
      errors.push({
        field: 'current_amount',
        message: 'Current amount must be a number',
      });
    } else if (current_amount < 0) {
      errors.push({
        field: 'current_amount',
        message: 'Current amount must be greater than or equal to 0',
      });
    } else if (target_amount && current_amount > target_amount) {
      errors.push({
        field: 'current_amount',
        message: 'Current amount cannot exceed target amount',
      });
    }
  }

  // Validate deadline (optional, future date)
  if (deadline !== undefined && deadline !== null && deadline !== '') {
    if (!isValidDateFormat(deadline)) {
      errors.push({
        field: 'deadline',
        message: 'Deadline must be in YYYY-MM-DD format',
      });
    } else {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        errors.push({
          field: 'deadline',
          message: 'Deadline must be a future date',
        });
      }
    }
  }

  // Validate priority (optional)
  if (priority !== undefined && !['high', 'medium', 'low'].includes(priority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be one of: high, medium, low',
    });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      { errors }
    );
  }

  next();
};

/**
 * Middleware to validate update goal request
 */
export const validateUpdateGoal = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors: ValidationError[] = [];
  const { name, goal_type, target_amount, current_amount, deadline, priority, status } = req.body;

  // At least one field must be provided
  if (Object.keys(req.body).length === 0) {
    return sendError(
      res,
      'At least one field must be provided for update',
      'VALIDATION_ERROR',
      400
    );
  }

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string' || name.length < 1 || name.length > 200) {
      errors.push({
        field: 'name',
        message: 'Goal name must be between 1 and 200 characters',
      });
    }
  }

  // Validate goal_type if provided
  if (goal_type !== undefined && !['savings', 'purchase', 'debt_payoff'].includes(goal_type)) {
    errors.push({
      field: 'goal_type',
      message: 'Goal type must be one of: savings, purchase, debt_payoff',
    });
  }

  // Validate target_amount if provided
  if (target_amount !== undefined && !isValidAmount(target_amount)) {
    errors.push({
      field: 'target_amount',
      message: 'Target amount must be a positive number with max 2 decimal places',
    });
  }

  // Validate current_amount if provided
  if (current_amount !== undefined) {
    if (typeof current_amount !== 'number' || current_amount < 0) {
      errors.push({
        field: 'current_amount',
        message: 'Current amount must be >= 0',
      });
    }
  }

  // Validate deadline if provided
  if (deadline !== undefined && deadline !== null && deadline !== '') {
    if (!isValidDateFormat(deadline)) {
      errors.push({
        field: 'deadline',
        message: 'Deadline must be in YYYY-MM-DD format',
      });
    }
  }

  // Validate priority if provided
  if (priority !== undefined && !['high', 'medium', 'low'].includes(priority)) {
    errors.push({
      field: 'priority',
      message: 'Priority must be one of: high, medium, low',
    });
  }

  // Validate status if provided
  if (status !== undefined && !['active', 'completed', 'paused', 'archived'].includes(status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: active, completed, paused, archived',
    });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      { errors }
    );
  }

  next();
};

/**
 * Middleware to validate allocate goal request
 */
export const validateAllocateGoal = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors: ValidationError[] = [];
  const { amount, notes } = req.body;

  // Validate amount (required, > 0)
  if (amount === undefined || amount === null) {
    errors.push({
      field: 'amount',
      message: 'Allocation amount is required',
    });
  } else if (!isValidAmount(amount)) {
    if (typeof amount !== 'number') {
      errors.push({
        field: 'amount',
        message: 'Amount must be a number',
      });
    } else if (amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be greater than 0',
      });
    } else {
      errors.push({
        field: 'amount',
        message: 'Amount can have maximum 2 decimal places',
      });
    }
  }

  // Validate notes (optional)
  if (notes !== undefined && typeof notes !== 'string') {
    errors.push({
      field: 'notes',
      message: 'Notes must be a string',
    });
  }

  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      { errors }
    );
  }

  next();
};
