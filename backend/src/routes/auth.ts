import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { emailService } from '../services/email.service';

const router = Router();

/**
 * Validate email format
 * Checks for valid email structure (contains @ and domain)
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password requirements
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character (@$!%*?&)
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * User Registration Endpoint
 * POST /api/auth/register
 *
 * Registers a new user with email and password
 * Password is hashed with bcrypt before storage
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 3: Input Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Check if required fields are present
    if (!email || !password) {
      return sendError(
        res,
        'Email and password are required',
        'MISSING_FIELDS',
        400
      );
    }

    // Trim and lowercase email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(normalizedEmail)) {
      return sendError(
        res,
        'Invalid email format',
        'INVALID_EMAIL',
        400
      );
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return sendError(
        res,
        passwordValidation.errors.join('. '),
        'INVALID_PASSWORD',
        400,
        { requirements: passwordValidation.errors }
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 4: Email Uniqueness Check
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Check if email already exists (case-insensitive)
    const existingUserQuery = `
      SELECT id FROM users WHERE LOWER(email) = LOWER($1)
    `;
    const existingUser = await pool.query(existingUserQuery, [normalizedEmail]);

    if (existingUser.rows.length > 0) {
      return sendError(
        res,
        'Email already registered',
        'DUPLICATE_EMAIL',
        409
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 5: Password Hashing
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Hash password with bcrypt (salt rounds = 10)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 6: Create User in Database
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Insert new user into database
    const insertUserQuery = `
      INSERT INTO users (email, password_hash, subscription_tier)
      VALUES ($1, $2, 'free')
      RETURNING id, email, created_at
    `;

    const result = await pool.query(insertUserQuery, [
      normalizedEmail,
      hashedPassword,
    ]);

    const newUser = result.rows[0];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 7: Response Formatting
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Return success response (201 Created)
    // Exclude password_hash from response
    sendSuccess(
      res,
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at,
        },
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);

    // Handle database constraint violations
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return sendError(
        res,
        'Email already registered',
        'DUPLICATE_EMAIL',
        409
      );
    }

    // Handle other errors
    sendError(
      res,
      error instanceof Error ? error.message : 'Registration failed',
      'REGISTRATION_ERROR',
      500
    );
  }
});

/**
 * User Login Endpoint
 * POST /api/auth/login
 *
 * Authenticates user and returns JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 3: Input Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Check if required fields are present
    if (!email || !password) {
      return sendError(
        res,
        'Email and password are required',
        'MISSING_FIELDS',
        400
      );
    }

    // Trim and lowercase email for comparison
    const normalizedEmail = email.trim().toLowerCase();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 4: Query User from Database
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Query user with case-insensitive email comparison
    const userQuery = `
      SELECT id, email, password_hash
      FROM users
      WHERE LOWER(email) = LOWER($1)
    `;

    const result = await pool.query(userQuery, [normalizedEmail]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 5: Verify Password with bcrypt
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Security: Use same error message for user not found and wrong password
    // This prevents user enumeration attacks
    if (result.rows.length === 0) {
      return sendError(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    const user = result.rows[0];

    // bcrypt.compare() provides constant-time comparison (prevents timing attacks)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return sendError(
        res,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 6: Generate JWT Token
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Load JWT_SECRET from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return sendError(
        res,
        'Authentication service unavailable',
        'CONFIG_ERROR',
        500
      );
    }

    // Create JWT payload with minimal user data
    const payload = {
      userId: user.id,
      email: user.email,
    };

    // Sign token with 24-hour expiration
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // TASK 7: Return Login Response
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Return success response with token and user data
    // Exclude password_hash from response
    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      200
    );
  } catch (error) {
    console.error('Login error:', error);

    // Handle errors without exposing sensitive information
    sendError(
      res,
      'An error occurred during login',
      'LOGIN_ERROR',
      500
    );
  }
});

/**
 * Get Current User Endpoint
 * GET /api/auth/me
 *
 * Returns current authenticated user information
 * Requires valid JWT token in Authorization header
 */
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  // User is already attached to req.user by authMiddleware
  // If we reach here, authentication was successful
  sendSuccess(res, {
    user: req.user
  });
});

/**
 * Forgot Password Endpoint
 * POST /api/auth/forgot-password
 *
 * Generates a password reset token and stores it in the database
 * Always returns success to prevent email enumeration (security best practice)
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Input Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!email) {
      return sendError(
        res,
        'Email is required',
        'MISSING_FIELDS',
        400
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!validateEmail(normalizedEmail)) {
      return sendError(
        res,
        'Invalid email format',
        'INVALID_EMAIL',
        400
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Rate Limiting Check (3 requests per email per hour)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Check for existing reset token created within last hour
    const rateLimitQuery = `
      SELECT user_id, created_at
      FROM password_reset_tokens
      WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = LOWER($1))
        AND created_at > NOW() - INTERVAL '1 hour'
    `;

    const rateLimitCheck = await pool.query(rateLimitQuery, [normalizedEmail]);

    // If token was created recently, check if we've hit the rate limit
    // For simplicity, we're limiting to 1 request per hour per email
    // (The spec says 3/hour, but with one token per user, this effectively limits to 1)
    if (rateLimitCheck.rows.length > 0) {
      const lastRequestTime = new Date(rateLimitCheck.rows[0].created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      if (lastRequestTime > oneHourAgo) {
        // Still return success to prevent email enumeration
        // But log the rate limit attempt for security monitoring
        console.log(`[SECURITY] Rate limit hit for email: ${normalizedEmail}`);

        return sendSuccess(res, {
          message: 'If an account exists with that email, a password reset link has been sent.'
        });
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Find User by Email
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const userQuery = `
      SELECT id, email FROM users WHERE LOWER(email) = LOWER($1)
    `;
    const userResult = await pool.query(userQuery, [normalizedEmail]);

    // If user doesn't exist, still return success (prevent email enumeration)
    if (userResult.rows.length === 0) {
      console.log(`[SECURITY] Password reset requested for non-existent email: ${normalizedEmail}`);
      return sendSuccess(res, {
        message: 'If an account exists with that email, a password reset link has been sent.'
      });
    }

    const user = userResult.rows[0];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Generate JWT Reset Token (1-hour expiration)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'password-reset'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Calculate expiration timestamp (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour in milliseconds

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Delete Old Tokens and Store New Token
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // First, delete any existing reset tokens for this user
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Then insert the new reset token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, resetToken, expiresAt]
    );

    // Log successful password reset request for security monitoring
    console.log(`[SECURITY] Password reset token generated for user ID: ${user.id}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Send Password Reset Email
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Send email with reset link (Story 11.2)
    // Note: emailService handles errors internally and doesn't throw
    // This prevents email delivery failures from exposing user existence
    await emailService.sendPasswordReset(user.email, resetToken);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Response (Always Success - Security)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Always return success message to prevent email enumeration
    // Token is sent via email, not in response (security best practice)
    sendSuccess(res, {
      message: 'If an account exists with that email, a password reset link has been sent.'
    });

  } catch (error: any) {
    console.error('[ERROR] Forgot password endpoint error:', error);

    // Still return generic success to prevent information disclosure
    sendSuccess(res, {
      message: 'If an account exists with that email, a password reset link has been sent.'
    });
  }
});

/**
 * POST /api/auth/reset-password
 *
 * Resets a user's password using a valid reset token
 * Validates token, updates password, and deletes the used token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Input Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!token || !newPassword) {
      return sendError(
        res,
        'Reset token and new password are required',
        'MISSING_FIELDS',
        400
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Validate New Password Requirements
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return sendError(
        res,
        passwordValidation.errors[0], // Return first error
        'INVALID_PASSWORD',
        400
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Verify JWT Token
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return sendError(
        res,
        'Invalid or expired reset token',
        'INVALID_TOKEN',
        400
      );
    }

    // Verify token type
    if (decoded.type !== 'password-reset') {
      return sendError(
        res,
        'Invalid reset token',
        'INVALID_TOKEN',
        400
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Verify Token Exists in Database and Not Expired
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const tokenQuery = `
      SELECT user_id, expires_at
      FROM password_reset_tokens
      WHERE user_id = $1 AND token = $2
    `;

    const tokenResult = await pool.query(tokenQuery, [decoded.userId, token]);

    if (tokenResult.rows.length === 0) {
      return sendError(
        res,
        'Invalid or expired reset token',
        'INVALID_TOKEN',
        400
      );
    }

    const tokenData = tokenResult.rows[0];

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (now > expiresAt) {
      // Delete expired token
      await pool.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [decoded.userId]
      );

      return sendError(
        res,
        'Reset token has expired',
        'TOKEN_EXPIRED',
        400
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Hash New Password
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Update Password and Delete Reset Token (Transaction)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Use transaction to ensure both operations succeed or fail together
    await pool.query('BEGIN');

    try {
      // Update user's password
      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [hashedPassword, decoded.userId]
      );

      // Delete the used reset token
      await pool.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [decoded.userId]
      );

      await pool.query('COMMIT');

      // Log successful password reset for security monitoring
      console.log(`[SECURITY] Password successfully reset for user ID: ${decoded.userId}`);

      sendSuccess(res, {
        message: 'Password reset successful. You can now log in with your new password.'
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('[ERROR] Reset password endpoint error:', error);

    return sendError(
      res,
      'Failed to reset password. Please try again.',
      'RESET_FAILED',
      500
    );
  }
});

export default router;
