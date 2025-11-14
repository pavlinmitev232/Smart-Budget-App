import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { sendError } from '../utils/response';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * Must be defined with 4 parameters (err, req, res, next) for Express to recognize it
 *
 * @param err - Error object
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details in development
  if (config.nodeEnv === 'development') {
    console.error('\n━━━━━━━━━━━━━━━━ ERROR ━━━━━━━━━━━━━━━━');
    console.error('Path:', req.method, req.path);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } else {
    // In production, log less verbose error (could integrate with logging service)
    console.error(`[Error] ${req.method} ${req.path}:`, err.message);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.statusCode, err.details);
    return;
  }

  // Handle database errors
  if (err.name === 'QueryError' || err.name === 'DatabaseError') {
    sendError(res, 'Database operation failed', 'DATABASE_ERROR', 500);
    return;
  }

  // Handle validation errors (for future use with validation libraries)
  if (err.name === 'ValidationError') {
    sendError(res, err.message, 'VALIDATION_ERROR', 400);
    return;
  }

  // Handle JWT errors (for future authentication)
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', 'INVALID_TOKEN', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token expired', 'TOKEN_EXPIRED', 401);
    return;
  }

  // Default error response for unhandled errors
  const message =
    config.nodeEnv === 'development'
      ? err.message
      : 'An unexpected error occurred';

  sendError(res, message, 'INTERNAL_SERVER_ERROR', 500);
}

/**
 * 404 handler for undefined routes
 * Should be added after all other routes
 *
 * @param req - Express request
 * @param res - Express response
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    `Route not found: ${req.method} ${req.path}`,
    'ROUTE_NOT_FOUND',
    404
  );
}
