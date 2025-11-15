import { Response } from 'express';
import { transactionsService } from './transactions.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth';
import {
  CreateTransactionDto,
  TransactionFilters,
  PaginationParams,
} from './transactions.types';

/**
 * Create a new transaction
 * @route POST /api/transactions
 * @access Protected (requires authentication)
 */
export const createTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // Extract userId from authenticated request (set by authMiddleware)
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        'User authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Extract transaction data from request body (already validated by middleware)
    const transactionData: CreateTransactionDto = {
      type: req.body.type,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
      description: req.body.description,
      sourceVendor: req.body.sourceVendor,
    };

    // Create transaction via service layer
    const transaction = await transactionsService.createTransaction(
      userId,
      transactionData
    );

    // Return 201 Created with transaction data
    return sendSuccess(
      res,
      { transaction },
      201
    );
  } catch (error) {
    console.error('Error in createTransaction controller:', error);
    return sendError(
      res,
      'Failed to create transaction',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
};

/**
 * Get transactions with filters and pagination
 * @route GET /api/transactions
 * @access Protected (requires authentication)
 */
export const getTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // Extract userId from authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        'User authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Parse query parameters with defaults
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string, 10) || 50,
      100
    ); // Max 100
    const sortBy = (req.query.sortBy as string) || 'date';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Build filters object
    const filters: TransactionFilters = {};
    if (req.query.type) {
      filters.type = req.query.type as 'income' | 'expense';
    }
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    if (req.query.startDate) {
      filters.startDate = req.query.startDate as string;
    }
    if (req.query.endDate) {
      filters.endDate = req.query.endDate as string;
    }

    // Build pagination object
    const pagination: PaginationParams = {
      page,
      limit,
      sortBy,
      sortOrder,
    };

    // Get transactions from service
    const result = await transactionsService.getTransactions(
      userId,
      filters,
      pagination
    );

    // Return 200 OK with transactions and pagination
    return sendSuccess(res, result);
  } catch (error) {
    console.error('Error in getTransactions controller:', error);
    return sendError(
      res,
      'Failed to fetch transactions',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
};

/**
 * Update an existing transaction
 * @route PUT /api/transactions/:id
 * @access Protected (requires authentication)
 */
export const updateTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // Extract userId from authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        'User authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Extract transaction ID from route params
    const transactionId = parseInt(req.params.id, 10);

    if (isNaN(transactionId)) {
      return sendError(res, 'Invalid transaction ID', 'BAD_REQUEST', 400);
    }

    // Extract transaction data from request body (already validated by middleware)
    const transactionData: CreateTransactionDto = {
      type: req.body.type,
      amount: req.body.amount,
      category: req.body.category,
      date: req.body.date,
      description: req.body.description,
      sourceVendor: req.body.sourceVendor,
    };

    // Update transaction via service layer
    const transaction = await transactionsService.updateTransaction(
      userId,
      transactionId,
      transactionData
    );

    // If transaction not found or doesn't belong to user, return 404
    if (!transaction) {
      return sendError(
        res,
        'Transaction not found',
        'NOT_FOUND',
        404
      );
    }

    // Return 200 OK with updated transaction
    return sendSuccess(res, { transaction });
  } catch (error) {
    console.error('Error in updateTransaction controller:', error);
    return sendError(
      res,
      'Failed to update transaction',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
};

/**
 * Delete a transaction
 * @route DELETE /api/transactions/:id
 * @access Protected (requires authentication)
 */
export const deleteTransaction = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // Extract userId from authenticated request
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(
        res,
        'User authentication required',
        'UNAUTHORIZED',
        401
      );
    }

    // Extract transaction ID from route params
    const transactionId = parseInt(req.params.id, 10);

    if (isNaN(transactionId)) {
      return sendError(res, 'Invalid transaction ID', 'BAD_REQUEST', 400);
    }

    // Delete transaction via service layer
    const deleted = await transactionsService.deleteTransaction(
      userId,
      transactionId
    );

    // If transaction not found or doesn't belong to user, return 404
    if (!deleted) {
      return sendError(
        res,
        'Transaction not found',
        'NOT_FOUND',
        404
      );
    }

    // Return 200 OK with success message
    return sendSuccess(res, { message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error in deleteTransaction controller:', error);
    return sendError(
      res,
      'Failed to delete transaction',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
};
