import { Request } from 'express';

// Request query parameters
export interface SummaryQuery {
  startDate?: string;
  endDate?: string;
}

export interface CategoryBreakdownQuery {
  startDate?: string;
  endDate?: string;
  type: 'income' | 'expense';
}

export interface TrendsQuery {
  startDate?: string;
  endDate?: string;
  groupBy: 'day' | 'week' | 'month';
}

// Response types
export interface SummaryData {
  totalIncome: string;
  totalExpenses: string;
  netBalance: string;
  transactionCount: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface CategoryBreakdownItem {
  category: string;
  amount: string;
  percentage: number;
  count: number;
}

export interface TrendsDataPoint {
  period: string;
  income: string;
  expenses: string;
}

// Authenticated request type
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}
