import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { timelineService, TimelineProjection } from './timeline.service';
import { notificationsService } from './notifications.service';
import { sendSuccess, sendError } from '../../utils/response';
import { goalsService } from './goals.service';

/**
 * Timeline Controller
 * HTTP request handlers for timeline and notification endpoints
 */
export const timelineController = {
  /**
   * POST /api/goals/recalculate
   * Manually trigger timeline recalculation for all user's goals
   */
  recalculateTimelines: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      // Get previous projections for comparison
      const goals = await goalsService.getGoals(userId, { status: 'active' });
      const previousProjections = new Map<number, { projectedCompletion: string | null }>();

      for (const goal of goals) {
        const prev = await timelineService.getPreviousProjection(goal.id);
        if (prev) {
          previousProjections.set(goal.id, prev);
        }
      }

      // Recalculate timelines
      const { projections, notifications, savingsCapacity } =
        await timelineService.recalculateUserTimelines(userId, previousProjections);

      // Store new snapshots
      for (const projection of projections) {
        await timelineService.storeTimelineSnapshot(projection.goalId, projection);
      }

      // Create notifications for significant changes
      for (const notification of notifications) {
        await notificationsService.createTimelineNotification(userId, notification);
      }

      return sendSuccess(res, {
        message: 'Timeline recalculation complete',
        projections,
        savingsCapacity,
        notificationsCreated: notifications.length,
      });
    } catch (error) {
      console.error('Recalculate timelines error:', error);
      return sendError(res, 'Failed to recalculate timelines', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/goals/projections
   * Get timeline projections for all active goals
   */
  getProjections: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const { projections, savingsCapacity } =
        await timelineService.recalculateUserTimelines(userId);

      return sendSuccess(res, {
        projections,
        savingsCapacity,
      });
    } catch (error) {
      console.error('Get projections error:', error);
      return sendError(res, 'Failed to get projections', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/goals/savings-capacity
   * Get the user's current savings capacity
   */
  getSavingsCapacity: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const savingsCapacity = await timelineService.calculateSavingsCapacity(userId);
      const expenseChange = await timelineService.detectExpenseChange(userId);

      return sendSuccess(res, {
        savingsCapacity,
        expenseChange,
      });
    } catch (error) {
      console.error('Get savings capacity error:', error);
      return sendError(res, 'Failed to get savings capacity', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/notifications
   * Get all notifications for the user
   */
  getNotifications: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const unreadOnly = req.query.unreadOnly === 'true';
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const notifications = await notificationsService.getNotifications(userId, {
        unreadOnly,
        limit,
      });

      const unreadCount = await notificationsService.getUnreadCount(userId);

      return sendSuccess(res, {
        notifications,
        unreadCount,
        total: notifications.length,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return sendError(res, 'Failed to get notifications', 'SERVER_ERROR', 500);
    }
  },

  /**
   * PUT /api/notifications/:id/read
   * Mark a notification as read
   */
  markNotificationRead: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const notificationId = parseInt(req.params.id, 10);

      if (isNaN(notificationId)) {
        return sendError(res, 'Invalid notification ID', 'INVALID_INPUT', 400);
      }

      const success = await notificationsService.markAsRead(userId, notificationId);

      if (!success) {
        return sendError(res, 'Notification not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, {
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      return sendError(res, 'Failed to mark notification as read', 'SERVER_ERROR', 500);
    }
  },

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read
   */
  markAllNotificationsRead: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const count = await notificationsService.markAllAsRead(userId);

      return sendSuccess(res, {
        message: `${count} notifications marked as read`,
        markedCount: count,
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return sendError(res, 'Failed to mark notifications as read', 'SERVER_ERROR', 500);
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  deleteNotification: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const notificationId = parseInt(req.params.id, 10);

      if (isNaN(notificationId)) {
        return sendError(res, 'Invalid notification ID', 'INVALID_INPUT', 400);
      }

      const success = await notificationsService.deleteNotification(userId, notificationId);

      if (!success) {
        return sendError(res, 'Notification not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, {
        message: 'Notification deleted',
      });
    } catch (error) {
      console.error('Delete notification error:', error);
      return sendError(res, 'Failed to delete notification', 'SERVER_ERROR', 500);
    }
  },

  /**
   * DELETE /api/notifications/all
   * Delete all notifications for the user
   */
  deleteAllNotifications: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const count = await notificationsService.deleteAllNotifications(userId);

      return sendSuccess(res, {
        message: `${count} notifications deleted`,
        deletedCount: count,
      });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      return sendError(res, 'Failed to delete notifications', 'SERVER_ERROR', 500);
    }
  },
};
