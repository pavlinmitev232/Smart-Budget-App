import { Response } from 'express';

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * Send a successful JSON response
 *
 * @param res - Express response object
 * @param data - Payload to send in response
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T = any>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error JSON response
 *
 * @param res - Express response object
 * @param message - Human-readable error message
 * @param code - Error code identifier (optional)
 * @param statusCode - HTTP status code (default: 500)
 * @param details - Additional error details (optional)
 */
export function sendError(
  res: Response,
  message: string,
  code?: string,
  statusCode: number = 500,
  details?: any
): Response<ErrorResponse> {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
    },
  };

  return res.status(statusCode).json(errorResponse);
}
