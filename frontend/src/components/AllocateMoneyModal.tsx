import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';

interface Goal {
  id: number;
  name: string;
  targetAmount: string;
  currentAmount: string;
  progressPercentage: number;
  remainingAmount: string;
}

interface AllocateMoneyModalProps {
  goal: Goal;
  onClose: () => void;
  onGoalCompleted?: () => void;
}

interface AllocateFormData {
  amount: number;
}

const AllocateMoneyModal: React.FC<AllocateMoneyModalProps> = ({ goal, onClose, onGoalCompleted }) => {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<AllocateFormData>();

  const amount = watch('amount');
  const remainingAmount = parseFloat(goal.remainingAmount);
  const newTotal = amount ? parseFloat(goal.currentAmount) + parseFloat(amount.toString()) : parseFloat(goal.currentAmount);
  const newPercentage = (newTotal / parseFloat(goal.targetAmount)) * 100;

  const onSubmit = async (data: AllocateFormData) => {
    try {
      setSubmitting(true);

      const response = await api.post(`/goals/${goal.id}/allocate`, {
        amount: parseFloat(data.amount.toString()),
      });

      const updatedGoal = response.data.data.goal;

      // Check if goal is now completed
      if (updatedGoal.isCompleted || updatedGoal.status === 'completed') {
        toast.success(`🎉 Goal completed! You reached ${goal.name}!`, { autoClose: 2000 });

        // Trigger confetti in parent component
        if (onGoalCompleted) {
          onGoalCompleted();
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.success(`$${parseFloat(data.amount.toString()).toFixed(2)} added to ${goal.name}`);
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to allocate money:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to add money');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Money to Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Goal Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{goal.name}</h3>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Current: ${parseFloat(goal.currentAmount).toLocaleString()}</span>
              <span>Target: ${parseFloat(goal.targetAmount).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              ${remainingAmount.toLocaleString()} remaining ({goal.progressPercentage.toFixed(1)}% complete)
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Add <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                    max: {
                      value: parseFloat(goal.remainingAmount),
                      message: `Cannot exceed remaining amount ($${parseFloat(goal.remainingAmount).toFixed(2)})`
                    },
                  })}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  autoFocus
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Preview */}
            {amount && amount > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">New total:</span> ${newTotal.toLocaleString()}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">New progress:</span> {Math.min(newPercentage, 100).toFixed(1)}%
                </p>
                {newPercentage >= 100 && (
                  <p className="text-sm font-medium text-green-600 mt-2">
                    🎉 This will complete your goal!
                  </p>
                )}
              </div>
            )}

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  const event = new Event('input', { bubbles: true });
                  const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                  if (input) {
                    input.value = '10';
                    input.dispatchEvent(event);
                  }
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                +$10
              </button>
              <button
                type="button"
                onClick={() => {
                  const event = new Event('input', { bubbles: true });
                  const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                  if (input) {
                    input.value = '50';
                    input.dispatchEvent(event);
                  }
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                +$50
              </button>
              <button
                type="button"
                onClick={() => {
                  const event = new Event('input', { bubbles: true });
                  const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                  if (input) {
                    input.value = '100';
                    input.dispatchEvent(event);
                  }
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                +$100
              </button>
              <button
                type="button"
                onClick={() => {
                  const event = new Event('input', { bubbles: true });
                  const input = document.querySelector('input[name="amount"]') as HTMLInputElement;
                  if (input) {
                    input.value = remainingAmount.toFixed(2);
                    input.dispatchEvent(event);
                  }
                }}
                className="px-3 py-2 text-sm border border-blue-300 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                Complete
              </button>
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400 flex items-center justify-center gap-2"
                disabled={submitting}
              >
                <DollarSign className="w-4 h-4" />
                {submitting ? 'Adding...' : 'Add Money'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AllocateMoneyModal;
