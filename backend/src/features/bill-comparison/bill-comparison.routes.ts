import express, { RequestHandler } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { withSubscriptionTier } from '../../middleware/featureGate';
import { billComparisonController } from './bill-comparison.controller';

const router = express.Router();

/**
 * Bill Comparison Routes
 * All routes require authentication
 * Routes that check tier limits also use withSubscriptionTier middleware
 */

// Image upload and management
router.post('/upload', authMiddleware, billComparisonController.uploadImage);
router.get('/images', authMiddleware, billComparisonController.getUnassignedImages);
router.get('/images/:id', authMiddleware, billComparisonController.getImage);
router.delete('/images/:id', authMiddleware, billComparisonController.deleteImage);

// Comparison management (needs tier for limit checks)
router.post('/compare', authMiddleware, withSubscriptionTier as unknown as RequestHandler, billComparisonController.createComparison as unknown as RequestHandler);
router.get('/comparisons', authMiddleware, billComparisonController.getComparisons);
router.get('/comparisons/:id', authMiddleware, billComparisonController.getComparison);
router.delete('/comparisons/:id', authMiddleware, billComparisonController.deleteComparison);
router.post('/comparisons/:id/analyze', authMiddleware, billComparisonController.analyzeComparison);

// Limits and usage (needs tier)
router.get('/limits', authMiddleware, withSubscriptionTier as unknown as RequestHandler, billComparisonController.getLimits as unknown as RequestHandler);

export default router;
