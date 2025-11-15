import { CATEGORIES } from './categories.constants';

/**
 * Categories Service
 * Business logic for category operations
 */
export const categoriesService = {
  /**
   * Get all predefined categories organized by type
   * @returns Object containing income and expense category arrays
   */
  getAllCategories: () => {
    return {
      income: [...CATEGORIES.income],
      expense: [...CATEGORIES.expense]
    };
  }
};
