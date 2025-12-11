import { timelineService, SavingsCapacity, TimelineProjection } from './timeline.service';
import { Goal } from './goals.types';

/**
 * Unit tests for Timeline Service
 * Tests AC2: Savings capacity calculation
 * Tests edge cases: no income profile, zero savings, negative savings
 */

describe('Timeline Service', () => {
  describe('calculateGoalProjection', () => {
    const baseSavingsCapacity: SavingsCapacity = {
      monthlyIncome: 5000,
      avgMonthlyExpenses: 3500,
      availableForSavings: 1500,
      hasIncomeProfile: true,
    };

    const baseGoal: Goal = {
      id: 1,
      userId: 1,
      name: 'Emergency Fund',
      goalType: 'savings',
      targetAmount: '10000',
      currentAmount: '2500',
      deadline: null,
      priority: 'high',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progressPercentage: 25,
      remainingAmount: '7500',
      isCompleted: false,
    };

    test('calculates months to goal correctly', () => {
      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        baseSavingsCapacity
      );

      // $7500 remaining / $1500 per month = 5 months
      expect(projection.monthsToGoal).toBe(5);
      expect(projection.monthlySavingsNeeded).toBe(1500);
      expect(projection.projectedCompletion).not.toBeNull();
    });

    test('handles goal with deadline', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 10);

      const goalWithDeadline: Goal = {
        ...baseGoal,
        deadline: futureDate.toISOString().split('T')[0],
      };

      const projection = timelineService.calculateGoalProjection(
        goalWithDeadline,
        baseSavingsCapacity
      );

      // $7500 remaining / 10 months = $750/month needed
      expect(projection.monthlySavingsNeeded).toBe(750);
    });

    test('handles zero savings capacity', () => {
      const zeroSavings: SavingsCapacity = {
        monthlyIncome: 3500,
        avgMonthlyExpenses: 3500,
        availableForSavings: 0,
        hasIncomeProfile: true,
      };

      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        zeroSavings
      );

      // With zero savings, can't calculate completion date
      expect(projection.monthsToGoal).toBeNull();
      expect(projection.projectedCompletion).toBeNull();
    });

    test('handles no income profile', () => {
      const noIncomeProfile: SavingsCapacity = {
        monthlyIncome: 0,
        avgMonthlyExpenses: 3500,
        availableForSavings: 0,
        hasIncomeProfile: false,
      };

      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        noIncomeProfile
      );

      expect(projection.monthsToGoal).toBeNull();
      expect(projection.availableForSavings).toBe(0);
    });

    test('handles already completed goal', () => {
      const completedGoal: Goal = {
        ...baseGoal,
        currentAmount: '10000',
        status: 'completed',
        isCompleted: true,
      };

      const projection = timelineService.calculateGoalProjection(
        completedGoal,
        baseSavingsCapacity
      );

      // Goal already reached
      expect(projection.monthsToGoal).toBe(0);
      expect(projection.projectedCompletion).not.toBeNull();
    });

    test('detects timeline improvement', () => {
      const previousProjection = {
        projectedCompletion: (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + 10);
          return date.toISOString().split('T')[0];
        })(),
      };

      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        baseSavingsCapacity,
        previousProjection
      );

      // Should detect improvement (5 months vs 10 months)
      expect(projection.timelineChangeMonths).toBeLessThan(0);
      expect(projection.reason).toContain('increased');
    });

    test('detects timeline worsening', () => {
      const previousProjection = {
        projectedCompletion: (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + 3);
          return date.toISOString().split('T')[0];
        })(),
      };

      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        baseSavingsCapacity,
        previousProjection
      );

      // Should detect worsening (5 months vs 3 months)
      expect(projection.timelineChangeMonths).toBeGreaterThan(0);
      expect(projection.reason).toContain('increased');
    });

    test('handles negative expense scenario', () => {
      // Edge case: very high income, low expenses
      const highSavings: SavingsCapacity = {
        monthlyIncome: 10000,
        avgMonthlyExpenses: 2000,
        availableForSavings: 8000,
        hasIncomeProfile: true,
      };

      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        highSavings
      );

      // $7500 remaining / $8000 per month = 1 month (rounded up)
      expect(projection.monthsToGoal).toBe(1);
    });

    test('handles very long timeline', () => {
      const lowSavings: SavingsCapacity = {
        monthlyIncome: 3600,
        avgMonthlyExpenses: 3500,
        availableForSavings: 100,
        hasIncomeProfile: true,
      };

      const projection = timelineService.calculateGoalProjection(
        baseGoal,
        lowSavings
      );

      // $7500 remaining / $100 per month = 75 months
      expect(projection.monthsToGoal).toBe(75);
    });
  });

  describe('Edge Cases', () => {
    test('handles goal with zero target amount', () => {
      const zeroTargetGoal: Goal = {
        id: 1,
        userId: 1,
        name: 'Zero Goal',
        goalType: 'savings',
        targetAmount: '0',
        currentAmount: '0',
        deadline: null,
        priority: 'low',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressPercentage: 0,
        remainingAmount: '0',
        isCompleted: false,
      };

      const capacity: SavingsCapacity = {
        monthlyIncome: 5000,
        avgMonthlyExpenses: 3000,
        availableForSavings: 2000,
        hasIncomeProfile: true,
      };

      const projection = timelineService.calculateGoalProjection(
        zeroTargetGoal,
        capacity
      );

      // Zero target = already complete
      expect(projection.monthsToGoal).toBe(0);
    });

    test('handles overfunded goal', () => {
      const overfundedGoal: Goal = {
        id: 1,
        userId: 1,
        name: 'Over Goal',
        goalType: 'savings',
        targetAmount: '1000',
        currentAmount: '1500',
        deadline: null,
        priority: 'low',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progressPercentage: 150,
        remainingAmount: '-500',
        isCompleted: true,
      };

      const capacity: SavingsCapacity = {
        monthlyIncome: 5000,
        avgMonthlyExpenses: 3000,
        availableForSavings: 2000,
        hasIncomeProfile: true,
      };

      const projection = timelineService.calculateGoalProjection(
        overfundedGoal,
        capacity
      );

      // Overfunded = already complete
      expect(projection.monthsToGoal).toBe(0);
    });
  });
});

// Mock tests that would require database
describe('Timeline Service (Integration - requires DB)', () => {
  test.skip('calculateSavingsCapacity returns correct values', async () => {
    // This test requires a database connection
    // In a real test environment, use a test database
    const capacity = await timelineService.calculateSavingsCapacity(1);
    expect(capacity).toHaveProperty('monthlyIncome');
    expect(capacity).toHaveProperty('avgMonthlyExpenses');
    expect(capacity).toHaveProperty('availableForSavings');
    expect(capacity).toHaveProperty('hasIncomeProfile');
  });

  test.skip('detectExpenseChange identifies significant changes', async () => {
    const result = await timelineService.detectExpenseChange(1);
    expect(result).toHaveProperty('currentMonthExpenses');
    expect(result).toHaveProperty('previousMonthExpenses');
    expect(result).toHaveProperty('percentageChange');
    expect(result).toHaveProperty('isSignificantChange');
    expect(result).toHaveProperty('direction');
  });
});
