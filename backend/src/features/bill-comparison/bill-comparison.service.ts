import pool from '../../config/database';
import {
  BillComparison,
  BillImage,
  ComparisonResult,
  IMAGE_CONSTRAINTS,
  COMPARISON_LIMITS,
} from './bill-comparison.types';
import { aiService } from '../../services/ai.service';
import { processAIResponse } from './bill-comparison.utils';

/**
 * Bill Comparison Service
 * Handles database operations for bill comparisons and images
 */
export const billComparisonService = {
  /**
   * Upload a bill image
   */
  uploadImage: async (
    userId: number,
    imageData: string,
    fileName: string,
    mimeType: string
  ): Promise<BillImage> => {
    // Calculate file size from base64
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const fileSize = Buffer.from(base64Data, 'base64').length;

    const result = await pool.query(
      `INSERT INTO bill_images (user_id, image_data, file_name, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, imageData, fileName, fileSize, mimeType]
    );

    return mapRowToBillImage(result.rows[0]);
  },

  /**
   * Get all images for a user (without comparison assigned)
   */
  getUnassignedImages: async (userId: number): Promise<BillImage[]> => {
    const result = await pool.query(
      `SELECT * FROM bill_images
       WHERE user_id = $1 AND comparison_id IS NULL
       ORDER BY uploaded_at DESC`,
      [userId]
    );

    return result.rows.map(mapRowToBillImage);
  },

  /**
   * Get a single image by ID
   */
  getImageById: async (userId: number, imageId: number): Promise<BillImage | null> => {
    const result = await pool.query(
      `SELECT * FROM bill_images WHERE id = $1 AND user_id = $2`,
      [imageId, userId]
    );

    return result.rows.length > 0 ? mapRowToBillImage(result.rows[0]) : null;
  },

  /**
   * Delete an image
   */
  deleteImage: async (userId: number, imageId: number): Promise<boolean> => {
    const result = await pool.query(
      `DELETE FROM bill_images WHERE id = $1 AND user_id = $2 RETURNING id`,
      [imageId, userId]
    );

    return result.rows.length > 0;
  },

  /**
   * Create a new comparison
   */
  createComparison: async (
    userId: number,
    imageIds: number[],
    title?: string
  ): Promise<BillComparison> => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create comparison
      const compResult = await client.query(
        `INSERT INTO bill_comparisons (user_id, title, status)
         VALUES ($1, $2, 'pending')
         RETURNING *`,
        [userId, title || null]
      );

      const comparison = compResult.rows[0];

      // Assign images to comparison
      for (let i = 0; i < imageIds.length; i++) {
        await client.query(
          `UPDATE bill_images
           SET comparison_id = $1, image_order = $2
           WHERE id = $3 AND user_id = $4`,
          [comparison.id, i + 1, imageIds[i], userId]
        );
      }

      await client.query('COMMIT');

      return mapRowToBillComparison(comparison);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get all comparisons for a user
   */
  getComparisons: async (
    userId: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ comparisons: BillComparison[]; total: number }> => {
    const { limit = 20, offset = 0 } = options;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM bill_comparisons WHERE user_id = $1`,
      [userId]
    );

    const result = await pool.query(
      `SELECT * FROM bill_comparisons
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      comparisons: result.rows.map(mapRowToBillComparison),
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  /**
   * Get a single comparison with images
   */
  getComparisonById: async (
    userId: number,
    comparisonId: number
  ): Promise<BillComparison | null> => {
    const compResult = await pool.query(
      `SELECT * FROM bill_comparisons WHERE id = $1 AND user_id = $2`,
      [comparisonId, userId]
    );

    if (compResult.rows.length === 0) return null;

    const imagesResult = await pool.query(
      `SELECT * FROM bill_images
       WHERE comparison_id = $1
       ORDER BY image_order ASC`,
      [comparisonId]
    );

    const comparison = mapRowToBillComparison(compResult.rows[0]);
    comparison.images = imagesResult.rows.map(mapRowToBillImage);

    return comparison;
  },

  /**
   * Update comparison status and results
   */
  updateComparisonResult: async (
    comparisonId: number,
    status: 'processing' | 'completed' | 'failed',
    resultSummary?: string,
    resultData?: object
  ): Promise<void> => {
    const shouldSetCompletedAt = status === 'completed' || status === 'failed';

    await pool.query(
      `UPDATE bill_comparisons
       SET status = $1,
           result_summary = $2,
           result_data = $3,
           completed_at = $4
       WHERE id = $5`,
      [
        status,
        resultSummary || null,
        resultData ? JSON.stringify(resultData) : null,
        shouldSetCompletedAt ? new Date() : null,
        comparisonId
      ]
    );
  },

  /**
   * Delete a comparison and its images
   */
  deleteComparison: async (userId: number, comparisonId: number): Promise<boolean> => {
    const result = await pool.query(
      `DELETE FROM bill_comparisons WHERE id = $1 AND user_id = $2 RETURNING id`,
      [comparisonId, userId]
    );

    return result.rows.length > 0;
  },

  /**
   * Get today's comparison count for tier limit check
   */
  getTodayComparisonCount: async (userId: number): Promise<number> => {
    const result = await pool.query(
      `SELECT COUNT(*) FROM bill_comparisons
       WHERE user_id = $1
       AND created_at >= CURRENT_DATE
       AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Check if user can create a comparison based on tier
   */
  canCreateComparison: async (userId: number, tier: string): Promise<boolean> => {
    const limit = COMPARISON_LIMITS[tier as keyof typeof COMPARISON_LIMITS] ?? COMPARISON_LIMITS.free;

    // Unlimited for pro
    if (limit === -1) return true;

    const todayCount = await billComparisonService.getTodayComparisonCount(userId);
    return todayCount < limit;
  },

  /**
   * Run AI analysis on a comparison
   */
  runAIAnalysis: async (
    userId: number,
    comparisonId: number
  ): Promise<ComparisonResult> => {
    // Get comparison with images
    const comparison = await billComparisonService.getComparisonById(userId, comparisonId);

    if (!comparison) {
      throw new Error('Comparison not found');
    }

    if (!comparison.images || comparison.images.length !== 2) {
      throw new Error('Comparison must have exactly 2 images');
    }

    // Update status to processing
    await billComparisonService.updateComparisonResult(comparisonId, 'processing');

    try {
      // Get images sorted by order
      const sortedImages = comparison.images.sort((a, b) => (a.imageOrder || 0) - (b.imageOrder || 0));
      const image1 = sortedImages[0];
      const image2 = sortedImages[1];

      // Call GPT Vision API
      const { result, tokensUsed, provider } = await aiService.compareBillsWithVision(
        image1.imageData,
        image2.imageData,
        userId
      );

      // Process and validate AI response with enhanced parsing (Story 12.3)
      const processedResult = processAIResponse(result);

      // Build full comparison result with enhanced metrics
      const comparisonResult: ComparisonResult = {
        bill1: processedResult.bill1,
        bill2: processedResult.bill2,
        matchedItems: processedResult.matchedItems,
        unmatchedBill1: processedResult.unmatchedBill1,
        unmatchedBill2: processedResult.unmatchedBill2,
        totalDifference: processedResult.totalDifference,
        percentageChange: processedResult.percentageChange,
        insights: result.insights || 'Analysis complete.',
        tokensUsed,
        provider,
        // Enhanced metrics from Story 12.3
        metrics: processedResult.metrics,
        categorizedItems: processedResult.categorizedItems,
        summaryInsights: processedResult.summaryInsights,
      };

      // Generate enhanced summary using summary insights
      const { summaryInsights, metrics } = processedResult;
      const summary = `${summaryInsights.totalChangeMessage}. ${summaryInsights.itemChangesSummary}. ${metrics.matchedCount} items matched.`;

      // Update comparison with results
      await billComparisonService.updateComparisonResult(
        comparisonId,
        'completed',
        summary,
        comparisonResult
      );

      return comparisonResult;
    } catch (error: any) {
      console.error('[Bill Comparison] AI analysis failed:', error.message);

      // Update status to failed
      await billComparisonService.updateComparisonResult(
        comparisonId,
        'failed',
        `Analysis failed: ${error.message}`
      );

      throw error;
    }
  },

  /**
   * Clean up orphaned images (no comparison after 24h)
   */
  cleanupOrphanedImages: async (): Promise<number> => {
    const result = await pool.query(
      `DELETE FROM bill_images
       WHERE comparison_id IS NULL
       AND uploaded_at < NOW() - INTERVAL '24 hours'`
    );

    return result.rowCount || 0;
  },

  /**
   * Validate image data
   */
  validateImage: (
    imageData: string,
    fileName: string,
    mimeType: string
  ): { valid: boolean; error?: string } => {
    // Check mime type
    if (!(IMAGE_CONSTRAINTS.allowedMimeTypes as readonly string[]).includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${IMAGE_CONSTRAINTS.allowedMimeTypes.join(', ')}`,
      };
    }

    // Check file extension
    const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
    if (!(IMAGE_CONSTRAINTS.allowedExtensions as readonly string[]).includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension. Allowed: ${IMAGE_CONSTRAINTS.allowedExtensions.join(', ')}`,
      };
    }

    // Calculate and check file size
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const fileSize = Buffer.from(base64Data, 'base64').length;

    if (fileSize > IMAGE_CONSTRAINTS.maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Maximum size: ${IMAGE_CONSTRAINTS.maxSizeBytes / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  },
};

/**
 * Map database row to BillImage
 */
function mapRowToBillImage(row: any): BillImage {
  return {
    id: row.id,
    userId: row.user_id,
    comparisonId: row.comparison_id,
    imageData: row.image_data,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    imageOrder: row.image_order,
    uploadedAt: row.uploaded_at.toISOString(),
  };
}

/**
 * Map database row to BillComparison
 */
function mapRowToBillComparison(row: any): BillComparison {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    resultSummary: row.result_summary,
    resultData: row.result_data,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}
