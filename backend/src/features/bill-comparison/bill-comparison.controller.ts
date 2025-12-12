import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { FeatureGatedRequest } from '../../middleware/featureGate';
import { billComparisonService } from './bill-comparison.service';
import { sendSuccess, sendError } from '../../utils/response';
import { COMPARISON_LIMITS } from './bill-comparison.types';

/**
 * Bill Comparison Controller
 * HTTP request handlers for bill comparison endpoints
 */
export const billComparisonController = {
  /**
   * POST /api/bill-comparison/upload
   * Upload a bill image
   */
  uploadImage: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { imageData, fileName, mimeType } = req.body;

      // Validate required fields
      if (!imageData || !fileName || !mimeType) {
        return sendError(res, 'Missing required fields: imageData, fileName, mimeType', 'VALIDATION_ERROR', 400);
      }

      // Validate image
      const validation = billComparisonService.validateImage(imageData, fileName, mimeType);
      if (!validation.valid) {
        return sendError(res, validation.error!, 'VALIDATION_ERROR', 400);
      }

      // Upload image
      const image = await billComparisonService.uploadImage(userId, imageData, fileName, mimeType);

      // Return without full image data (just metadata)
      return sendSuccess(res, {
        image: {
          id: image.id,
          fileName: image.fileName,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          uploadedAt: image.uploadedAt,
        },
        message: 'Image uploaded successfully',
      }, 201);
    } catch (error) {
      console.error('Upload image error:', error);
      return sendError(res, 'Failed to upload image', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/bill-comparison/images
   * Get unassigned images for the user
   */
  getUnassignedImages: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const images = await billComparisonService.getUnassignedImages(userId);

      // Return without full image data
      return sendSuccess(res, {
        images: images.map((img) => ({
          id: img.id,
          fileName: img.fileName,
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          uploadedAt: img.uploadedAt,
        })),
      });
    } catch (error) {
      console.error('Get images error:', error);
      return sendError(res, 'Failed to get images', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/bill-comparison/images/:id
   * Get a single image with data
   */
  getImage: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const imageId = parseInt(req.params.id, 10);

      if (isNaN(imageId)) {
        return sendError(res, 'Invalid image ID', 'VALIDATION_ERROR', 400);
      }

      const image = await billComparisonService.getImageById(userId, imageId);

      if (!image) {
        return sendError(res, 'Image not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, { image });
    } catch (error) {
      console.error('Get image error:', error);
      return sendError(res, 'Failed to get image', 'SERVER_ERROR', 500);
    }
  },

  /**
   * DELETE /api/bill-comparison/images/:id
   * Delete an image
   */
  deleteImage: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const imageId = parseInt(req.params.id, 10);

      if (isNaN(imageId)) {
        return sendError(res, 'Invalid image ID', 'VALIDATION_ERROR', 400);
      }

      const deleted = await billComparisonService.deleteImage(userId, imageId);

      if (!deleted) {
        return sendError(res, 'Image not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, { message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete image error:', error);
      return sendError(res, 'Failed to delete image', 'SERVER_ERROR', 500);
    }
  },

  /**
   * POST /api/bill-comparison/compare
   * Create a new comparison from uploaded images
   */
  createComparison: async (req: FeatureGatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const userTier = req.user!.subscriptionTier || 'free';
      const { imageIds, title } = req.body;

      // Validate imageIds
      if (!imageIds || !Array.isArray(imageIds) || imageIds.length !== 2) {
        return sendError(res, 'Exactly 2 image IDs are required', 'VALIDATION_ERROR', 400);
      }

      // Check tier limit
      const canCreate = await billComparisonService.canCreateComparison(userId, userTier);
      if (!canCreate) {
        const limit = COMPARISON_LIMITS[userTier as keyof typeof COMPARISON_LIMITS] ?? COMPARISON_LIMITS.free;
        return sendError(
          res,
          `Daily comparison limit reached (${limit}). Upgrade your plan for more comparisons.`,
          'LIMIT_EXCEEDED',
          429
        );
      }

      // Verify images exist and belong to user
      for (const imageId of imageIds) {
        const image = await billComparisonService.getImageById(userId, imageId);
        if (!image) {
          return sendError(res, `Image ${imageId} not found`, 'NOT_FOUND', 404);
        }
        if (image.comparisonId) {
          return sendError(res, `Image ${imageId} is already assigned to a comparison`, 'VALIDATION_ERROR', 400);
        }
      }

      // Create comparison
      const comparison = await billComparisonService.createComparison(userId, imageIds, title);

      return sendSuccess(res, {
        comparison,
        message: 'Comparison created successfully',
      }, 201);
    } catch (error) {
      console.error('Create comparison error:', error);
      return sendError(res, 'Failed to create comparison', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/bill-comparison/comparisons
   * Get all comparisons for the user
   */
  getComparisons: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const offset = parseInt(req.query.offset as string, 10) || 0;

      const { comparisons, total } = await billComparisonService.getComparisons(userId, { limit, offset });

      return sendSuccess(res, {
        comparisons,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + comparisons.length < total,
        },
      });
    } catch (error) {
      console.error('Get comparisons error:', error);
      return sendError(res, 'Failed to get comparisons', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/bill-comparison/comparisons/:id
   * Get a single comparison with images
   */
  getComparison: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const comparisonId = parseInt(req.params.id, 10);

      if (isNaN(comparisonId)) {
        return sendError(res, 'Invalid comparison ID', 'VALIDATION_ERROR', 400);
      }

      const comparison = await billComparisonService.getComparisonById(userId, comparisonId);

      if (!comparison) {
        return sendError(res, 'Comparison not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, { comparison });
    } catch (error) {
      console.error('Get comparison error:', error);
      return sendError(res, 'Failed to get comparison', 'SERVER_ERROR', 500);
    }
  },

  /**
   * DELETE /api/bill-comparison/comparisons/:id
   * Delete a comparison
   */
  deleteComparison: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const comparisonId = parseInt(req.params.id, 10);

      if (isNaN(comparisonId)) {
        return sendError(res, 'Invalid comparison ID', 'VALIDATION_ERROR', 400);
      }

      const deleted = await billComparisonService.deleteComparison(userId, comparisonId);

      if (!deleted) {
        return sendError(res, 'Comparison not found', 'NOT_FOUND', 404);
      }

      return sendSuccess(res, { message: 'Comparison deleted successfully' });
    } catch (error) {
      console.error('Delete comparison error:', error);
      return sendError(res, 'Failed to delete comparison', 'SERVER_ERROR', 500);
    }
  },

  /**
   * POST /api/bill-comparison/comparisons/:id/analyze
   * Run AI analysis on a comparison
   */
  analyzeComparison: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const comparisonId = parseInt(req.params.id, 10);

      if (isNaN(comparisonId)) {
        return sendError(res, 'Invalid comparison ID', 'VALIDATION_ERROR', 400);
      }

      // Get comparison to check status
      const comparison = await billComparisonService.getComparisonById(userId, comparisonId);

      if (!comparison) {
        return sendError(res, 'Comparison not found', 'NOT_FOUND', 404);
      }

      // Don't re-analyze completed comparisons unless explicitly requested
      if (comparison.status === 'processing') {
        return sendError(res, 'Analysis is already in progress', 'CONFLICT', 409);
      }

      // Run AI analysis
      const result = await billComparisonService.runAIAnalysis(userId, comparisonId);

      return sendSuccess(res, {
        comparison: {
          id: comparisonId,
          status: 'completed',
          resultData: result,
        },
        message: 'Analysis completed successfully',
      });
    } catch (error: any) {
      console.error('Analyze comparison error:', error);
      return sendError(res, error.message || 'Failed to analyze comparison', 'SERVER_ERROR', 500);
    }
  },

  /**
   * GET /api/bill-comparison/limits
   * Get user's comparison limits and usage
   */
  getLimits: async (req: FeatureGatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const userTier = req.user!.subscriptionTier || 'free';

      const todayCount = await billComparisonService.getTodayComparisonCount(userId);
      const limit = COMPARISON_LIMITS[userTier as keyof typeof COMPARISON_LIMITS] ?? COMPARISON_LIMITS.free;

      return sendSuccess(res, {
        tier: userTier,
        dailyLimit: limit === -1 ? 'unlimited' : limit,
        usedToday: todayCount,
        remaining: limit === -1 ? 'unlimited' : Math.max(0, limit - todayCount),
        canCreate: limit === -1 || todayCount < limit,
      });
    } catch (error) {
      console.error('Get limits error:', error);
      return sendError(res, 'Failed to get limits', 'SERVER_ERROR', 500);
    }
  },
};
