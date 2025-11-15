import { Response } from 'express';
import { analyticsService } from './analytics.service';
import { AuthRequest } from './analytics.types';
import { startOfMonth, endOfDay, format, parseISO, isValid } from 'date-fns';

export class AnalyticsController {
  /**
   * Validate and parse date parameters
   */
  private validateDateRange(
    startDate?: string,
    endDate?: string
  ): { startDate: string; endDate: string; error?: string } {
    let start: Date;
    let end: Date;

    // Default to current month if not provided
    if (!startDate || !endDate) {
      start = startOfMonth(new Date());
      end = endOfDay(new Date());
    } else {
      // Parse and validate dates
      try {
        start = parseISO(startDate);
        end = parseISO(endDate);

        if (!isValid(start) || !isValid(end)) {
          return { startDate: '', endDate: '', error: 'Invalid date format. Use YYYY-MM-DD' };
        }

        if (end < start) {
          return { startDate: '', endDate: '', error: 'endDate must be greater than or equal to startDate' };
        }

        // Cannot select future dates
        if (end > new Date()) {
          return { startDate: '', endDate: '', error: 'Cannot select future dates' };
        }
      } catch (error) {
        return { startDate: '', endDate: '', error: 'Invalid date format. Use YYYY-MM-DD' };
      }
    }

    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }

  /**
   * GET /api/analytics/summary
   */
  async getSummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      const { startDate: rawStart, endDate: rawEnd } = req.query;

      const validation = this.validateDateRange(
        rawStart as string | undefined,
        rawEnd as string | undefined
      );

      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validation.error },
        });
      }

      const data = await analyticsService.getSummary(
        userId,
        validation.startDate,
        validation.endDate
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch summary analytics',
        },
      });
    }
  }

  /**
   * GET /api/analytics/category-breakdown
   */
  async getCategoryBreakdown(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      const { startDate: rawStart, endDate: rawEnd, type } = req.query;

      // Validate type parameter
      if (!type || (type !== 'income' && type !== 'expense')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'type parameter must be either "income" or "expense"',
          },
        });
      }

      const validation = this.validateDateRange(
        rawStart as string | undefined,
        rawEnd as string | undefined
      );

      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validation.error },
        });
      }

      const data = await analyticsService.getCategoryBreakdown(
        userId,
        validation.startDate,
        validation.endDate,
        type as 'income' | 'expense'
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Get category breakdown error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch category breakdown',
        },
      });
    }
  }

  /**
   * GET /api/analytics/trends
   */
  async getTrends(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        });
      }

      const { startDate: rawStart, endDate: rawEnd, groupBy } = req.query;

      // Validate groupBy parameter
      if (!groupBy || !['day', 'week', 'month'].includes(groupBy as string)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'groupBy parameter must be "day", "week", or "month"',
          },
        });
      }

      const validation = this.validateDateRange(
        rawStart as string | undefined,
        rawEnd as string | undefined
      );

      if (validation.error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: validation.error },
        });
      }

      const data = await analyticsService.getTrends(
        userId,
        validation.startDate,
        validation.endDate,
        groupBy as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('Get trends error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch trends data',
        },
      });
    }
  }
}

export const analyticsController = new AnalyticsController();
