import { Request, Response, NextFunction } from 'express';
import { CATEGORIES } from '../categories/categories.constants';
import { sendError } from '../../utils/response';
import { CreateTransactionDto, ValidationError } from './transactions.types';

/**
 * Validate date format YYYY-MM-DD
 */
function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Check if it's a valid date
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

  // Check max 2 decimal places
  const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
  return decimalPlaces <= 2;
}

/**
 * Middleware to validate create transaction request
 */
export const validateCreateTransaction = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const errors: ValidationError[] = [];
  const { type, amount, category, date, description, sourceVendor } = req.body;

  // Validate type (required)
  if (!type) {
    errors.push({
      field: 'type',
      message: 'Transaction type is required',
    });
  } else if (type !== 'income' && type !== 'expense') {
    errors.push({
      field: 'type',
      message: 'Transaction type must be either "income" or "expense"',
    });
  }

  // Validate amount (required)
  if (amount === undefined || amount === null) {
    errors.push({
      field: 'amount',
      message: 'Amount is required',
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

  // Validate category (required)
  if (!category) {
    errors.push({
      field: 'category',
      message: 'Category is required',
    });
  } else {
    // Check if category exists in predefined list
    const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
    if (!allCategories.includes(category)) {
      errors.push({
        field: 'category',
        message: `Category "${category}" is not valid. Please use one of the predefined categories.`,
      });
    } else if (type === 'income' || type === 'expense') {
      // Check if category matches transaction type
      const categoriesForType = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
      if (!categoriesForType.includes(category)) {
        errors.push({
          field: 'category',
          message: `Category "${category}" is not valid for ${type} transactions`,
        });
      }
    }
  }

  // Validate date (required)
  if (!date) {
    errors.push({
      field: 'date',
      message: 'Date is required',
    });
  } else if (!isValidDateFormat(date)) {
    errors.push({
      field: 'date',
      message: 'Date must be in YYYY-MM-DD format',
    });
  }

  // Validate optional fields (type checking only)
  if (description !== undefined && typeof description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description must be a string',
    });
  }

  if (sourceVendor !== undefined && typeof sourceVendor !== 'string') {
    errors.push({
      field: 'sourceVendor',
      message: 'Source vendor must be a string',
    });
  }

  // If there are validation errors, return 400
  if (errors.length > 0) {
    return sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      { errors }
    );
  }

  // Validation passed, continue to controller
  next();
};
