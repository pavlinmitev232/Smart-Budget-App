import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import {
  getIncomeProfile,
  createOrUpdateIncomeProfile,
  deleteIncomeProfile
} from './income.controller.js';

const router = express.Router();

/**
 * Income Profile Routes
 *
 * All routes require authentication
 */

// GET /api/user/income - Get user's income profile
router.get('/api/user/income', authMiddleware, getIncomeProfile);

// POST /api/user/income - Create or update income profile
router.post('/api/user/income', authMiddleware, createOrUpdateIncomeProfile);

// DELETE /api/user/income - Delete income profile
router.delete('/api/user/income', authMiddleware, deleteIncomeProfile);

export default router;
