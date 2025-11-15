import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from './transactions.controller';
import { validateCreateTransaction } from './transactions.validation';
import { validateGetTransactionsQuery } from './transactions.queryValidation';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/transactions
 * @desc    Get transactions with filters and pagination
 * @access  Protected (requires authentication)
 *
 * Middleware chain:
 * 1. authMiddleware - Verifies JWT and adds user to req.user
 * 2. validateGetTransactionsQuery - Validates query parameters
 * 3. getTransactions - Controller that fetches transactions
 */
router.get('/', authMiddleware, validateGetTransactionsQuery, getTransactions);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Protected (requires authentication)
 *
 * Middleware chain:
 * 1. authMiddleware - Verifies JWT and adds user to req.user
 * 2. validateCreateTransaction - Validates request body
 * 3. createTransaction - Controller that creates the transaction
 */
router.post('/', authMiddleware, validateCreateTransaction, createTransaction);

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update an existing transaction
 * @access  Protected (requires authentication)
 *
 * Middleware chain:
 * 1. authMiddleware - Verifies JWT and adds user to req.user
 * 2. validateCreateTransaction - Validates request body (same as create)
 * 3. updateTransaction - Controller that updates the transaction
 */
router.put(
  '/:id',
  authMiddleware,
  validateCreateTransaction,
  updateTransaction
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete a transaction
 * @access  Protected (requires authentication)
 *
 * Middleware chain:
 * 1. authMiddleware - Verifies JWT and adds user to req.user
 * 2. deleteTransaction - Controller that deletes the transaction
 */
router.delete('/:id', authMiddleware, deleteTransaction);

export default router;
