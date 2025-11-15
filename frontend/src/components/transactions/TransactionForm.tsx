import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';

/**
 * Transaction form data structure
 */
interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description?: string;
  sourceVendor?: string;
}

/**
 * Transaction object from API
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
 * Categories response from API
 */
interface CategoriesResponse {
  success: boolean;
  data: {
    income: string[];
    expense: string[];
  };
}

/**
 * TransactionForm Props
 */
interface TransactionFormProps {
  mode: 'create' | 'edit';
  transaction?: Transaction;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Transaction Form Component
 * Handles both creating new transactions and editing existing ones
 */
export default function TransactionForm({
  mode,
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [categories, setCategories] = useState<{
    income: string[];
    expense: string[];
  }>({ income: [], expense: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    defaultValues: mode === 'edit' && transaction
      ? {
          type: transaction.type,
          amount: parseFloat(transaction.amount),
          category: transaction.category,
          date: transaction.date,
          description: transaction.description || '',
          sourceVendor: transaction.sourceVendor || '',
        }
      : {
          type: 'expense',
          date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
        },
  });

  // Watch type field to filter categories
  const selectedType = watch('type');
  const selectedCategory = watch('category');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<CategoriesResponse>('/categories');
        if (response.data.success) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setApiError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  // Clear category if it's not valid for the selected type
  useEffect(() => {
    if (selectedCategory) {
      const validCategories = categories[selectedType] || [];
      if (!validCategories.includes(selectedCategory)) {
        setValue('category', '');
      }
    }
  }, [selectedType, selectedCategory, categories, setValue]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // Clean up empty optional fields (convert empty strings to undefined)
      const cleanedData = {
        ...data,
        description: data.description?.trim() || undefined,
        sourceVendor: data.sourceVendor?.trim() || undefined,
      };

      if (mode === 'create') {
        // POST /api/transactions
        await api.post('/transactions', cleanedData);
      } else if (mode === 'edit' && transaction) {
        // PUT /api/transactions/:id
        await api.put(`/transactions/${transaction.id}`, cleanedData);
      }

      // Success! Close form and trigger parent refresh
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting transaction:', error);
      const errorMessage =
        error.response?.data?.error?.message || 'Failed to save transaction';
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get filtered categories based on selected type
  const filteredCategories = categories[selectedType] || [];

  const title = mode === 'create' ? 'Add Transaction' : 'Edit Transaction';
  const submitButtonText = mode === 'create' ? 'Add Transaction' : 'Update Transaction';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* API Error Message */}
          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {apiError}
            </div>
          )}

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  {...register('type', { required: 'Type is required' })}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Income</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  {...register('type', { required: 'Type is required' })}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-700">Expense</span>
              </label>
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                step="0.01"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' },
                  valueAsNumber: true, // Convert string to number for API
                })}
                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              {...register('date', { required: 'Date is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Description Textarea */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional notes about this transaction"
            />
          </div>

          {/* Source/Vendor Input */}
          <div>
            <label htmlFor="sourceVendor" className="block text-sm font-medium text-gray-700 mb-1">
              Source / Vendor
            </label>
            <input
              type="text"
              id="sourceVendor"
              {...register('sourceVendor')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Whole Foods, ABC Company"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
