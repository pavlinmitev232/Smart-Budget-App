import { Router } from 'express';
import { getCategories } from './categories.controller';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Get all predefined categories (income and expense)
 * @access  Public (no authentication required)
 */
router.get('/', getCategories);

export default router;
