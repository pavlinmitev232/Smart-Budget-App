import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import TransactionForm from '../components/transactions/TransactionForm';
import api from '../services/api';

/**
 * Transaction interface
 */
interface Transaction {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string | null;
  sourceVendor: string | null;
}

/**
 * Category interface
 */
interface Category {
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

/**
 * Filters interface
 */
interface Filters {
  type: '' | 'income' | 'expense';
  category: string;
  startDate: string;
  endDate: string;
}

/**
 * Pagination interface
 */
interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    type: (searchParams.get('type') as '' | 'income' | 'expense') || '',
    category: searchParams.get('category') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '50'),
    totalPages: 1,
    totalCount: 0,
  });

  // Delete confirmation state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetch categories on mount
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success) {
          const allCategories = [
            ...response.data.data.income,
            ...response.data.data.expense,
          ];
          setCategories(allCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  /**
   * Fetch transactions when filters or pagination changes
   */
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);

        // Build query params
        const params = new URLSearchParams();
        if (filters.type) params.append('type', filters.type);
        if (filters.category) params.append('category', filters.category);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());

        const response = await api.get(`/transactions?${params.toString()}`);
        if (response.data.success) {
          setTransactions(response.data.data.transactions);
          setPagination(prev => ({
            ...prev,
            totalPages: response.data.data.pagination.totalPages,
            totalCount: response.data.data.pagination.totalItems,
          }));
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Update URL with current filters and pagination
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.category) params.set('category', filters.category);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    setSearchParams(params);
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Open form in create mode
   */
  const handleAddTransaction = () => {
    setFormMode('create');
    setEditingTransaction(undefined);
    setShowForm(true);
  };

  /**
   * Open form in edit mode
   */
  const handleEditTransaction = (transaction: Transaction) => {
    setFormMode('edit');
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  /**
   * Handle successful form submission
   */
  const handleFormSuccess = () => {
    setShowForm(false);
    // Refresh transactions by resetting filters (triggers useEffect)
    setFilters({ ...filters });
    // TODO: Show success toast notification
  };

  /**
   * Handle form cancel
   */
  const handleFormCancel = () => {
    setShowForm(false);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteDialog(true);
  };

  /**
   * Confirm delete transaction
   */
  const handleDeleteConfirm = async () => {
    if (!deletingTransaction) return;

    try {
      setIsDeleting(true);
      const response = await api.delete(`/transactions/${deletingTransaction.id}`);

      if (response.data.success) {
        // Close dialog
        setShowDeleteDialog(false);
        setDeletingTransaction(null);

        // Refresh transaction list
        setFilters({ ...filters });

        // TODO: Show success toast
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Cancel delete
   */
  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingTransaction(null);
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setFilters({ type: '', category: '', startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  /**
   * Handle items per page change
   */
  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  /**
   * Calculate pagination display
   */
  const paginationStart = (pagination.page - 1) * pagination.limit + 1;
  const paginationEnd = Math.min(pagination.page * pagination.limit, pagination.totalCount);

  /**
   * Get available categories for current filter type
   */
  const availableCategories = filters.type
    ? categories.filter(cat => cat.type === filters.type)
    : categories;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <button
              onClick={handleAddTransaction}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              Add Transaction
            </button>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-3">
              <button
                onClick={handleClearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {pagination.totalCount === 0
                  ? 'No transactions yet'
                  : 'No transactions match your filters'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {pagination.totalCount === 0
                  ? 'Get started by creating a new transaction.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
              {pagination.totalCount === 0 && (
                <div className="mt-6">
                  <button
                    onClick={handleAddTransaction}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Add your first transaction
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Transaction Table - Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.type.charAt(0).toUpperCase() +
                              transaction.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {transaction.description || '—'}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                            transaction.type === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(transaction)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Transaction Cards - Mobile */}
              <div className="md:hidden space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.category}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.type.charAt(0).toUpperCase() +
                          transaction.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {transaction.description || 'No description'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-lg font-bold ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleEditTransaction(transaction)}
                          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(transaction)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Items per page:</label>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Pagination info */}
                <p className="text-sm text-gray-700">
                  Showing {paginationStart} - {paginationEnd} of{' '}
                  {pagination.totalCount} transactions
                </p>

                {/* Page navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          mode={formMode}
          transaction={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && deletingTransaction && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Transaction
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this transaction? This action cannot be
              undone.
            </p>
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">
                {deletingTransaction.category}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(deletingTransaction.date)} •{' '}
                <span
                  className={
                    deletingTransaction.type === 'income'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {formatCurrency(deletingTransaction.amount)}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
