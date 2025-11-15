import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// GET /api/analytics/summary
router.get('/summary', (req, res) => analyticsController.getSummary(req, res));

// GET /api/analytics/category-breakdown
router.get('/category-breakdown', (req, res) =>
  analyticsController.getCategoryBreakdown(req, res)
);

// GET /api/analytics/trends
router.get('/trends', (req, res) => analyticsController.getTrends(req, res));

export default router;
