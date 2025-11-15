import pool from '../../config/database';
import {
  CreateTransactionDto,
  Transaction,
  TransactionRow,
  TransactionFilters,
  PaginationParams,
  PaginationMetadata,
} from './transactions.types';

/**
 * Convert database row (snake_case) to camelCase Transaction object
 */
function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as 'income' | 'expense',
    amount: row.amount,
    category: row.category,
    date: row.date.toISOString().split('T')[0], // YYYY-MM-DD format
    description: row.description,
    sourceVendor: row.source_vendor,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/**
 * Transaction Service
 * Business logic for transaction operations
 */
export const transactionsService = {
  /**
   * Create a new transaction for a user
   * @param userId - ID of the authenticated user
   * @param data - Transaction data
   * @returns Created transaction
   */
  createTransaction: async (
    userId: number,
    data: CreateTransactionDto
  ): Promise<Transaction> => {
    const query = `
      INSERT INTO transactions (
        user_id,
        type,
        amount,
        category,
        date,
        description,
        source_vendor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      userId,
      data.type,
      data.amount,
      data.category,
      data.date,
      data.description || null,
      data.sourceVendor || null,
    ];

    try {
      const result = await pool.query<TransactionRow>(query, values);
      const transaction = mapRowToTransaction(result.rows[0]);
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  },

  /**
   * Get transactions for a user with filters and pagination
   * @param userId - ID of the authenticated user
   * @param filters - Optional filters (type, category, date range)
   * @param pagination - Pagination and sorting parameters
   * @returns Transactions and pagination metadata
   */
  getTransactions: async (
    userId: number,
    filters: TransactionFilters,
    pagination: PaginationParams
  ): Promise<{ transactions: Transaction[]; pagination: PaginationMetadata }> => {
    // Build WHERE clause dynamically
    const whereConditions: string[] = ['user_id = $1'];
    const values: any[] = [userId];
    let paramCount = 1;

    // Add type filter
    if (filters.type) {
      paramCount++;
      whereConditions.push(`type = $${paramCount}`);
      values.push(filters.type);
    }

    // Add category filter
    if (filters.category) {
      paramCount++;
      whereConditions.push(`category = $${paramCount}`);
      values.push(filters.category);
    }

    // Add date range filters
    if (filters.startDate) {
      paramCount++;
      whereConditions.push(`date >= $${paramCount}`);
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      whereConditions.push(`date <= $${paramCount}`);
      values.push(filters.endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Map sortBy to database column name
    const sortByMap: Record<string, string> = {
      date: 'date',
      amount: 'amount',
      category: 'category',
      createdAt: 'created_at',
    };
    const sortColumn = sortByMap[pagination.sortBy] || 'date';
    const sortDirection = pagination.sortOrder.toUpperCase();

    // Calculate offset for pagination
    const offset = (pagination.page - 1) * pagination.limit;

    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const totalItems = parseInt(countResult.rows[0].count, 10);

      // Get transactions with pagination
      const dataQuery = `
        SELECT *
        FROM transactions
        WHERE ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}, id DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      const dataValues = [...values, pagination.limit, offset];
      const dataResult = await pool.query<TransactionRow>(dataQuery, dataValues);

      // Map rows to Transaction objects
      const transactions = dataResult.rows.map(mapRowToTransaction);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalItems / pagination.limit);
      const paginationMetadata: PaginationMetadata = {
        currentPage: pagination.page,
        totalPages: totalPages || 1,
        totalItems,
        itemsPerPage: pagination.limit,
      };

      return {
        transactions,
        pagination: paginationMetadata,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  },

  /**
   * Update an existing transaction
   * @param userId - ID of the authenticated user
   * @param id - Transaction ID to update
   * @param data - Updated transaction data
   * @returns Updated transaction or null if not found/unauthorized
   */
  updateTransaction: async (
    userId: number,
    id: number,
    data: CreateTransactionDto
  ): Promise<Transaction | null> => {
    const query = `
      UPDATE transactions
      SET
        type = $1,
        amount = $2,
        category = $3,
        date = $4,
        description = $5,
        source_vendor = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND user_id = $8
      RETURNING *
    `;

    const values = [
      data.type,
      data.amount,
      data.category,
      data.date,
      data.description || null,
      data.sourceVendor || null,
      id,
      userId,
    ];

    try {
      const result = await pool.query<TransactionRow>(query, values);

      // If no rows updated, transaction not found or belongs to different user
      if (result.rows.length === 0) {
        return null;
      }

      const transaction = mapRowToTransaction(result.rows[0]);
      return transaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  },

  /**
   * Delete a transaction
   * @param userId - ID of the authenticated user
   * @param id - Transaction ID to delete
   * @returns true if deleted, false if not found/unauthorized
   */
  deleteTransaction: async (
    userId: number,
    id: number
  ): Promise<boolean> => {
    const query = `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
    `;

    const values = [id, userId];

    try {
      const result = await pool.query(query, values);

      // rowCount indicates how many rows were deleted
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  },
};
