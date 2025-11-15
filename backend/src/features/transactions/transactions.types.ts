/**
 * TypeScript type definitions for transactions feature
 */

/**
 * Transaction type - income or expense
 */
export type TransactionType = 'income' | 'expense';

/**
 * Data Transfer Object for creating a new transaction
 */
export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD format
  description?: string;
  sourceVendor?: string;
}

/**
 * Transaction entity (matches database schema)
 */
export interface Transaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: string; // Decimal stored as string for precision
  category: string;
  date: string; // ISO date string
  description: string | null;
  sourceVendor: string | null;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Database row format (snake_case as returned from pg)
 */
export interface TransactionRow {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  category: string;
  date: Date;
  description: string | null;
  source_vendor: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Standard API response for transaction creation
 */
export interface CreateTransactionResponse {
  success: true;
  data: {
    transaction: Transaction;
  };
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Transaction filters for GET queries
 */
export interface TransactionFilters {
  type?: TransactionType;
  category?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/**
 * Pagination metadata in response
 */
export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/**
 * Paginated response for GET transactions
 */
export interface PaginatedTransactionsResponse {
  success: true;
  data: {
    transactions: Transaction[];
    pagination: PaginationMetadata;
  };
}
