import pool from '../../config/database';
import { TimelineNotification } from './timeline.service';

/**
 * Notification types
 */
export type NotificationType = 'timeline_improvement' | 'timeline_worsening' | 'goal_completed' | 'goal_at_risk';

/**
 * Stored notification
 */
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  goalId?: number;
  goalName?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

/**
 * Notifications Service
 * Handles creating and managing user notifications
 */
export const notificationsService = {
  /**
   * Create a timeline change notification
   */
  createTimelineNotification: async (
    userId: number,
    notification: TimelineNotification
  ): Promise<Notification> => {
    const type: NotificationType = notification.type === 'improvement'
      ? 'timeline_improvement'
      : 'timeline_worsening';

    const title = notification.type === 'improvement'
      ? '🎯 Great News!'
      : '⚠️ Goal Timeline Extended';

    let message = '';
    if (notification.type === 'improvement') {
      message = `Your "${notification.goalName}" goal timeline improved by ${notification.changeMonths} month${notification.changeMonths > 1 ? 's' : ''}!\n\n` +
        `You'll now reach your goal by ${formatDate(notification.newDate)} instead of ${formatDate(notification.previousDate)}.\n\n` +
        `Reason: ${notification.reason}`;
    } else {
      message = `Your "${notification.goalName}" completion delayed by ${notification.changeMonths} month${notification.changeMonths > 1 ? 's' : ''}.\n\n` +
        `New projected date: ${formatDate(notification.newDate)}\n\n` +
        `Reason: ${notification.reason}`;

      if (notification.aiSuggestion) {
        message += `\n\nAI Suggestion: ${notification.aiSuggestion}`;
      }
    }

    const metadata = {
      goalId: notification.goalId,
      changeMonths: notification.changeMonths,
      previousDate: notification.previousDate,
      newDate: notification.newDate,
      reason: notification.reason,
      aiSuggestion: notification.aiSuggestion,
    };

    const result = await pool.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        goal_id,
        goal_name,
        metadata,
        is_read
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false)
      RETURNING *`,
      [
        userId,
        type,
        title,
        message,
        notification.goalId,
        notification.goalName,
        JSON.stringify(metadata),
      ]
    );

    return mapRowToNotification(result.rows[0]);
  },

  /**
   * Get all notifications for a user
   */
  getNotifications: async (
    userId: number,
    options: { unreadOnly?: boolean; limit?: number } = {}
  ): Promise<Notification[]> => {
    const { unreadOnly = false, limit = 50 } = options;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (unreadOnly) {
      query += ` AND is_read = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map(mapRowToNotification);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (userId: number): Promise<number> => {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (userId: number, notificationId: number): Promise<boolean> => {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id`,
      [notificationId, userId]
    );
    return result.rows.length > 0;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (userId: number): Promise<number> => {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return result.rowCount || 0;
  },

  /**
   * Delete old notifications (older than 30 days)
   */
  cleanupOldNotifications: async (): Promise<number> => {
    const result = await pool.query(
      `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'`
    );
    return result.rowCount || 0;
  },

  /**
   * Delete a specific notification
   */
  deleteNotification: async (userId: number, notificationId: number): Promise<boolean> => {
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [notificationId, userId]
    );
    return result.rows.length > 0;
  },

  /**
   * Delete all notifications for a user
   */
  deleteAllNotifications: async (userId: number): Promise<number> => {
    const result = await pool.query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount || 0;
  },
};

/**
 * Map database row to Notification object
 */
function mapRowToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    goalId: row.goal_id,
    goalName: row.goal_name,
    metadata: row.metadata
      ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
      : undefined,
    isRead: row.is_read,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
