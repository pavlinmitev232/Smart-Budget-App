import { Request, Response } from 'express';
import { categoriesService } from './categories.service';
import { sendSuccess } from '../../utils/response';

/**
 * Get all predefined categories
 * @route GET /api/categories
 * @access Public
 */
export const getCategories = (req: Request, res: Response): Response => {
  const categories = categoriesService.getAllCategories();
  return sendSuccess(res, categories);
};
