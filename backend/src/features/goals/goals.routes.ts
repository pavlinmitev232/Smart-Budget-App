import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { goalsController } from './goals.controller';
import { timelineController } from './timeline.controller';
import {
  validateCreateGoal,
  validateUpdateGoal,
  validateAllocateGoal,
} from './goals.validation';

const router = express.Router();

/**
 * Goals Routes
 * All routes require authentication
 */

// Timeline endpoints (must be before :id routes to avoid conflicts)
// POST /api/goals/recalculate - Manually trigger timeline recalculation
router.post('/recalculate', authMiddleware, timelineController.recalculateTimelines);

// GET /api/goals/projections - Get timeline projections for all active goals
router.get('/projections', authMiddleware, timelineController.getProjections);

// GET /api/goals/savings-capacity - Get the user's current savings capacity
router.get('/savings-capacity', authMiddleware, timelineController.getSavingsCapacity);

// GET /api/goals - List all goals for the authenticated user
router.get('/', authMiddleware, goalsController.getGoals);

// GET /api/goals/:id - Get a single goal by ID
router.get('/:id', authMiddleware, goalsController.getGoalById);

// POST /api/goals - Create a new goal
router.post('/', authMiddleware, validateCreateGoal, goalsController.createGoal);

// PUT /api/goals/:id - Update an existing goal
router.put('/:id', authMiddleware, validateUpdateGoal, goalsController.updateGoal);

// DELETE /api/goals/:id - Delete (archive) a goal
router.delete('/:id', authMiddleware, goalsController.deleteGoal);

// POST /api/goals/:id/allocate - Allocate money to a goal
router.post('/:id/allocate', authMiddleware, validateAllocateGoal, goalsController.allocateToGoal);

export default router;
