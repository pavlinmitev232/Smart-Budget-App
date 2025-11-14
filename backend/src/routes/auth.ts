import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { authMiddleware, AuthRequest } from '../middleware/auth';

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
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
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

export default router;
