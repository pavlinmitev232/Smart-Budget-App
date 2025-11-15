/**
 * Predefined transaction categories for MVP
 * Income: 5 categories
 * Expense: 10 categories
 */

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Gifts",
  "Other Income"
] as const;

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Healthcare",
  "Shopping",
  "Personal Care",
  "Education",
  "Other Expenses"
] as const;

/**
 * Combined categories object organized by type
 */
export const CATEGORIES = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES
} as const;

/**
 * Type utilities for type-safe category access
 */
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type CategoryType = 'income' | 'expense';
