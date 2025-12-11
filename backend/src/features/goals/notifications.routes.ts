import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { timelineController } from './timeline.controller';

const router = express.Router();

/**
 * Notifications Routes
 * All routes require authentication
 */

// GET /api/notifications - Get all notifications for the user
router.get('/', authMiddleware, timelineController.getNotifications);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authMiddleware, timelineController.markAllNotificationsRead);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', authMiddleware, timelineController.markNotificationRead);

// DELETE /api/notifications/all - Delete all notifications for the user
router.delete('/all', authMiddleware, timelineController.deleteAllNotifications);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authMiddleware, timelineController.deleteNotification);

export default router;
