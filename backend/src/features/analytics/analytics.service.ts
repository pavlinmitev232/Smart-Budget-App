import pool from '../../config/database';
import {
  SummaryData,
  CategoryBreakdownItem,
  TrendsDataPoint,
} from './analytics.types';

export class AnalyticsService {
  /**
   * Get summary analytics for a date range
   */
  async getSummary(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<SummaryData> {
    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE user_id = $1 AND date >= $2 AND date <= $3
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);
    const row = result.rows[0];

    const totalIncome = row.total_income || '0';
    const totalExpenses = row.total_expenses || '0';
    const netBalance = (
      parseFloat(totalIncome) - parseFloat(totalExpenses)
    ).toFixed(2);

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: parseInt(row.transaction_count) || 0,
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Get category breakdown by type (income or expense)
   */
  async getCategoryBreakdown(
    userId: number,
    startDate: string,
    endDate: string,
    type: 'income' | 'expense'
  ): Promise<CategoryBreakdownItem[]> {
    // First get total for percentage calculation
    const totalQuery = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $1 AND type = $2 AND date >= $3 AND date <= $4
    `;

    const totalResult = await pool.query(totalQuery, [
      userId,
      type,
      startDate,
      endDate,
    ]);
    const overallTotal = parseFloat(totalResult.rows[0].total) || 0;

    // Get breakdown by category
    const query = `
      SELECT
        category,
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1 AND type = $2 AND date >= $3 AND date <= $4
      GROUP BY category
      ORDER BY total DESC
    `;

    const result = await pool.query(query, [userId, type, startDate, endDate]);

    return result.rows.map((row) => ({
      category: row.category,
      amount: row.total,
      percentage:
        overallTotal > 0
          ? parseFloat(
              ((parseFloat(row.total) / overallTotal) * 100).toFixed(1)
            )
          : 0,
      count: parseInt(row.count),
    }));
  }

  /**
   * Get trends data grouped by time period
   */
  async getTrends(
    userId: number,
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<TrendsDataPoint[]> {
    const query = `
      SELECT
        DATE_TRUNC($4, date) as period,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      GROUP BY period
      ORDER BY period ASC
    `;

    const result = await pool.query(query, [
      userId,
      startDate,
      endDate,
      groupBy,
    ]);

    return result.rows.map((row) => ({
      period: row.period,
      income: row.income,
      expenses: row.expenses,
    }));
  }
}

export const analyticsService = new AnalyticsService();
