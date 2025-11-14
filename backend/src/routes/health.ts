import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

/**
 * Health check endpoint
 * GET /api/health
 *
 * Returns system health status including database connectivity
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connectivity
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      // Return success response with health status
      sendSuccess(
        res,
        {
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
        200
      );
    } else {
      // Return error response if database is not connected
      sendError(
        res,
        'Database connection failed',
        'DATABASE_DISCONNECTED',
        503,
        {
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    console.error('Health check error:', error);
    sendError(
      res,
      error instanceof Error ? error.message : 'Health check failed',
      'HEALTH_CHECK_ERROR',
      503,
      {
        status: 'error',
        database: 'unknown',
        timestamp: new Date().toISOString(),
      }
    );
  }
});

export default router;
