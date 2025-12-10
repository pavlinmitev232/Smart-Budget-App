import React, { useState, useEffect } from 'react';
import {
  Plus,
  Target,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Edit2,
  Trash2,
  DollarSign,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import Confetti from 'react-confetti';
import GoalFormModal from '../components/GoalFormModal';
import AllocateMoneyModal from '../components/AllocateMoneyModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

interface Goal {
  id: number;
  userId: number;
  name: string;
  goalType: 'savings' | 'purchase' | 'debt_payoff';
  targetAmount: string;
  currentAmount: string;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
  progressPercentage: number;
  remainingAmount: string;
  isCompleted: boolean;
}

type SortOption = 'priority' | 'deadline' | 'progress';
type StatusFilter = 'active' | 'completed' | 'paused' | 'all';

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [tierLimit, setTierLimit] = useState<{ current: number; max: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [statusFilter]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get('/goals', { params });
      setGoals(response.data.data.goals);
    } catch (error: any) {
      console.error('Failed to fetch goals:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleAllocateMoney = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsAllocateModalOpen(true);
  };

  const handleDeleteGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteGoal = async () => {
    if (!selectedGoal) return;

    try {
      await api.delete(`/goals/${selectedGoal.id}`);
      toast.success('Goal deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (error: any) {
      console.error('Failed to delete goal:', error);
      toast.error(error.response?.data?.error?.message || 'Failed to delete goal');
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsAllocateModalOpen(false);
    setSelectedGoal(null);
    fetchGoals();
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <Target className="w-6 h-6 text-blue-500" />;
      case 'purchase':
        return <ShoppingBag className="w-6 h-6 text-purple-500" />;
      case 'debt_payoff':
        return <CreditCard className="w-6 h-6 text-red-500" />;
      default:
        return <Target className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return 'No deadline';
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const getProgressBarColor = (percentage: number, isCompleted: boolean) => {
    if (isCompleted) return 'bg-green-500';
    if (percentage < 33) return 'bg-red-500';
    if (percentage < 67) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getDeadlineColor = (deadline: string | null) => {
    if (!deadline) return 'text-gray-500';
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'text-red-600'; // Overdue
    if (days < 30) return 'text-red-600'; // < 1 month
    if (days < 90) return 'text-yellow-600'; // 1-3 months
    return 'text-green-600'; // > 3 months
  };

  const calculateSummary = () => {
    const activeGoals = goals.filter(g => g.status === 'active');
    const totalGoals = activeGoals.length;
    const totalTarget = activeGoals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return { totalGoals, totalTarget, totalSaved, overallProgress };
  };

  const summary = calculateSummary();

  const sortGoals = (goals: Goal[]): Goal[] => {
    const sorted = [...goals];
    switch (sortBy) {
      case 'priority':
        return sorted.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      case 'deadline':
        return sorted.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
      case 'progress':
        return sorted.sort((a, b) => b.progressPercentage - a.progressPercentage);
      default:
        return sorted;
    }
  };

  const sortedGoals = sortGoals(goals);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Goals</h1>
            <p className="text-gray-600 mt-1">Track your savings and spending goals</p>
          </div>
          <button
            onClick={handleCreateGoal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Goal
          </button>
        </div>

        {/* Summary Cards */}
        {summary.totalGoals > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Goals</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalGoals}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Target</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${summary.totalTarget.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Saved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${summary.totalSaved.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{summary.overallProgress.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">{Math.round(summary.overallProgress)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {sortedGoals.length === 0 && (
        <div className="text-center py-16">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {statusFilter === 'active' ? 'No Active Goals' : statusFilter === 'completed' ? 'No Completed Goals' : 'No Goals Yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {statusFilter === 'active'
              ? 'Create a new goal to start tracking your progress!'
              : statusFilter === 'completed'
              ? 'Complete a goal to see it here.'
              : 'Start tracking your financial goals today!'}
          </p>
          <button
            onClick={handleCreateGoal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Goal
          </button>
        </div>
      )}

      {/* Goals Grid */}
      {sortedGoals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGoals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getGoalIcon(goal.goalType)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                      {goal.status === 'completed' && (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>${parseFloat(goal.currentAmount).toLocaleString()}</span>
                  <span>${parseFloat(goal.targetAmount).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressBarColor(goal.progressPercentage, goal.isCompleted)}`}
                    style={{ width: `${Math.min(goal.progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {goal.progressPercentage.toFixed(1)}% complete
                </div>
              </div>

              {/* Deadline */}
              <div className="text-sm mb-4">
                <span className="font-medium text-gray-700">Deadline:</span>{' '}
                <span className={`font-medium ${getDeadlineColor(goal.deadline)}`}>
                  {getDaysRemaining(goal.deadline)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAllocateMoney(goal)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-colors text-sm ${
                    goal.status === 'completed'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  disabled={goal.status === 'completed'}
                  title={goal.status === 'completed' ? 'Goal already completed' : 'Add money to this goal'}
                >
                  <DollarSign className="w-4 h-4" />
                  {goal.status === 'completed' ? 'Completed' : 'Add Money'}
                </button>
                <button
                  onClick={() => handleEditGoal(goal)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGoal(goal)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <GoalFormModal onClose={handleModalClose} />
      )}

      {isEditModalOpen && selectedGoal && (
        <GoalFormModal goal={selectedGoal} onClose={handleModalClose} />
      )}

      {isAllocateModalOpen && selectedGoal && (
        <AllocateMoneyModal
          goal={selectedGoal}
          onClose={handleModalClose}
          onGoalCompleted={() => {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Goal"
        message={`Are you sure you want to delete "${selectedGoal?.name}"? This action cannot be undone.`}
        onConfirm={confirmDeleteGoal}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedGoal(null);
        }}
        confirmText="Delete Goal"
      />
    </div>
    </>
  );
};

export default Goals;
