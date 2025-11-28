import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getSubscriptionStatus } from './subscription.controller';

const router = express.Router();

/**
 * GET /api/user/subscription
 * Get current user's subscription status and quota
 */
router.get('/api/user/subscription', authMiddleware, getSubscriptionStatus);

export default router;
