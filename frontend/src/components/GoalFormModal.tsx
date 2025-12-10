import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'react-toastify';

interface Goal {
  id: number;
  name: string;
  goalType: 'savings' | 'purchase' | 'debt_payoff';
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
}

interface GoalFormModalProps {
  goal?: Goal;
  onClose: () => void;
}

interface GoalFormData {
  name: string;
  goal_type: 'savings' | 'purchase' | 'debt_payoff';
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
}

const GoalFormModal: React.FC<GoalFormModalProps> = ({ goal, onClose }) => {
  const isEditMode = !!goal;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<GoalFormData>({
    defaultValues: {
      name: goal?.name || '',
      goal_type: goal?.goalType || 'savings',
      target_amount: goal ? parseFloat(goal.targetAmount) : 0,
      current_amount: goal ? parseFloat(goal.currentAmount) : 0,
      deadline: goal?.deadline || '',
      priority: goal?.priority || 'medium',
    },
  });

  const onSubmit = async (data: GoalFormData) => {
    try {
      setSubmitting(true);

      // Format data for API - convert strings to numbers
      const payload = {
        name: data.name,
        goal_type: data.goal_type,
        target_amount: parseFloat(data.target_amount.toString()),
        current_amount: data.current_amount ? parseFloat(data.current_amount.toString()) : 0,
        deadline: data.deadline || null,
        priority: data.priority,
      };

      if (isEditMode) {
        await api.put(`/goals/${goal.id}`, payload);
        toast.success('Goal updated successfully');
      } else {
        await api.post('/goals', payload);
        toast.success('Goal created successfully');
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to save goal:', error);
      const errorMessage = error.response?.data?.error?.message || 'Failed to save goal';

      // Check for tier limit error
      if (error.response?.data?.error?.code === 'TIER_LIMIT_EXCEEDED') {
        const data = error.response.data.error.data;
        toast.error(
          `Goal limit reached. You have ${data.activeGoals}/${data.limit} goals. Upgrade to ${data.currentTier === 'free' ? 'Basic for 10 goals or Pro for unlimited' : 'Pro for unlimited goals'}.`,
          { autoClose: 5000 }
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get today's date for min deadline
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditMode ? 'Edit Goal' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Goal name is required',
                minLength: { value: 1, message: 'Name must be at least 1 character' },
                maxLength: { value: 200, message: 'Name cannot exceed 200 characters' },
              })}
              placeholder="e.g., Emergency Fund"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register('goal_type', { required: 'Goal type is required' })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.goal_type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="savings">Savings</option>
              <option value="purchase">Purchase</option>
              <option value="debt_payoff">Debt Payoff</option>
            </select>
            {errors.goal_type && (
              <p className="text-red-500 text-sm mt-1">{errors.goal_type.message}</p>
            )}
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                {...register('target_amount', {
                  required: 'Target amount is required',
                  min: { value: 0.01, message: 'Target must be greater than 0' },
                  max: { value: 99999999.99, message: 'Target amount too large' },
                })}
                placeholder="0.00"
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.target_amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.target_amount && (
              <p className="text-red-500 text-sm mt-1">{errors.target_amount.message}</p>
            )}
          </div>

          {/* Current Amount (only show for create mode) */}
          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('current_amount', {
                    min: { value: 0, message: 'Amount cannot be negative' },
                  })}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.current_amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.current_amount && (
                <p className="text-red-500 text-sm mt-1">{errors.current_amount.message}</p>
              )}
            </div>
          )}

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline (Optional)
            </label>
            <input
              type="date"
              min={today}
              {...register('deadline')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.priority ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {errors.priority && (
              <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalFormModal;
