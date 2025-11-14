import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Extended Express Request interface with authenticated user information
 */
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

/**
 * JWT Authentication Middleware
 *
 * Protects routes by verifying JWT tokens from Authorization header.
 * Extracts user information from valid tokens and attaches to req.user.
 *
 * @param req - Express request with optional user property
 * @param res - Express response
 * @param next - Express next function
 *
 * @example
 * // Protect individual route
 * router.get('/transactions', authMiddleware, getTransactions);
 *
 * // Protect all routes in router
 * router.use(authMiddleware);
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and follows Bearer format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'No token provided', 'NO_TOKEN', 401);
      return;
    }

    // Extract token after "Bearer " prefix
    const token = authHeader.split(' ')[1];

    // Verify token signature and decode payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
    };

    // Attach user information to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };

    // Proceed to next middleware or route handler
    next();
  } catch (error: any) {
    // Handle expired tokens
    if (error.name === 'TokenExpiredError') {
      sendError(res, 'Invalid or expired token', 'TOKEN_EXPIRED', 401);
      return;
    }

    // Handle invalid token signature or malformed tokens
    if (error.name === 'JsonWebTokenError') {
      sendError(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
      return;
    }

    // Handle any other authentication errors
    sendError(res, 'Authentication failed', 'AUTH_ERROR', 401);
  }
};
