import { Request, Response, NextFunction } from 'express';
import { CATEGORIES } from '../categories/categories.constants';
import { sendError } from '../../utils/response';
import { ValidationError } from './transactions.types';

/**
 * Valid sort fields for transactions
 */
const VALID_SORT_FIELDS = ['date', 'amount', 'category', 'createdAt'];

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
 * Parse and validate integer
 */
function parsePositiveInt(value: any, fieldName: string): number | null {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
}

/**
 * Middleware to validate query parameters for GET /api/transactions
 */
export const validateGetTransactionsQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors: ValidationError[] = [];
  const {
    page,
    limit,
    type,
    category,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = req.query;

  // Validate page (optional, default: 1)
  if (page !== undefined) {
    const parsedPage = parsePositiveInt(page, 'page');
    if (parsedPage === null) {
      errors.push({
        field: 'page',
        message: 'Page must be a positive integer',
      });
    }
  }

  // Validate limit (optional, default: 50, max: 100)
  if (limit !== undefined) {
    const parsedLimit = parsePositiveInt(limit, 'limit');
    if (parsedLimit === null) {
      errors.push({
        field: 'limit',
        message: 'Limit must be a positive integer',
      });
    } else if (parsedLimit > 100) {
      errors.push({
        field: 'limit',
        message: 'Limit cannot exceed 100',
      });
    }
  }

  // Validate type (optional)
  if (type !== undefined && type !== '') {
    if (type !== 'income' && type !== 'expense') {
      errors.push({
        field: 'type',
        message: 'Type must be either "income" or "expense"',
      });
    }
  }

  // Validate category (optional)
  if (category !== undefined && category !== '') {
    const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense] as readonly string[];
    if (!allCategories.includes(category as string)) {
      errors.push({
        field: 'category',
        message: `Category "${category}" is not valid. Please use one of the predefined categories.`,
      });
    }
  }

  // Validate startDate (optional)
  if (startDate !== undefined && startDate !== '') {
    if (!isValidDateFormat(startDate as string)) {
      errors.push({
        field: 'startDate',
        message: 'Start date must be in YYYY-MM-DD format',
      });
    }
  }

  // Validate endDate (optional)
  if (endDate !== undefined && endDate !== '') {
    if (!isValidDateFormat(endDate as string)) {
      errors.push({
        field: 'endDate',
        message: 'End date must be in YYYY-MM-DD format',
      });
    }
  }

  // Validate date range logic (startDate should be before endDate)
  if (
    startDate &&
    endDate &&
    isValidDateFormat(startDate as string) &&
    isValidDateFormat(endDate as string)
  ) {
    if (new Date(startDate as string) > new Date(endDate as string)) {
      errors.push({
        field: 'dateRange',
        message: 'Start date must be before or equal to end date',
      });
    }
  }

  // Validate sortBy (optional, default: 'date')
  if (sortBy !== undefined && sortBy !== '') {
    if (!VALID_SORT_FIELDS.includes(sortBy as string)) {
      errors.push({
        field: 'sortBy',
        message: `Sort field must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
      });
    }
  }

  // Validate sortOrder (optional, default: 'desc')
  if (sortOrder !== undefined && sortOrder !== '') {
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      errors.push({
        field: 'sortOrder',
        message: 'Sort order must be either "asc" or "desc"',
      });
    }
  }

  // If there are validation errors, return 400
  if (errors.length > 0) {
    return sendError(
      res,
      'Query validation failed',
      'VALIDATION_ERROR',
      400,
      { errors }
    );
  }

  // Validation passed, continue to controller
  next();
};
