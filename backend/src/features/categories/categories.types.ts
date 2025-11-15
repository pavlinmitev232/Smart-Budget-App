/**
 * TypeScript type definitions for categories feature
 */

/**
 * Category type - can be income or expense
 */
export type CategoryType = 'income' | 'expense';

/**
 * Individual category item (string literal)
 */
export type Category = string;

/**
 * Categories organized by type
 */
export interface CategoriesData {
  income: readonly string[];
  expense: readonly string[];
}

/**
 * Standard API response for categories endpoint
 */
export interface CategoriesResponse {
  success: true;
  data: CategoriesData;
}

/**
 * Type guard to check if a string is a valid category type
 */
export function isCategoryType(value: string): value is CategoryType {
  return value === 'income' || value === 'expense';
}
