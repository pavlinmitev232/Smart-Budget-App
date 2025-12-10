import { Response } from 'express';
import pool from '../../config/database.js';
import { AuthRequest } from '../../middleware/auth.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Income frequency types
 */
type IncomeFrequency = 'hourly' | 'weekly' | 'biweekly' | 'monthly' | 'annual';

/**
 * Income profile interface
 */
interface IncomeProfile {
  primaryIncomeAmount: number;
  primaryIncomeFrequency: IncomeFrequency;
  primaryIncomeSource?: string;
  additionalMonthlyIncome: number;
  normalizedMonthlyIncome: number;
}

/**
 * Normalize income to monthly amount based on frequency
 *
 * Conversion rates:
 * - Hourly: amount × 40 hours × 4.33 weeks
 * - Weekly: amount × 4.33
 * - Biweekly: amount × 2.17
 * - Monthly: amount × 1
 * - Annual: amount ÷ 12
 */
export function normalizeIncomeToMonthly(
  amount: number,
  frequency: IncomeFrequency
): number {
  const conversionRates: Record<IncomeFrequency, number> = {
    hourly: 40 * 4.33,    // 40 hours/week × 4.33 weeks/month
    weekly: 4.33,         // 4.33 weeks/month
    biweekly: 2.17,       // 26 biweekly periods / 12 months
    monthly: 1,           // Already monthly
    annual: 1 / 12        // 12 months/year
  };

  const rate = conversionRates[frequency];
  return Math.round(amount * rate * 100) / 100; // Round to 2 decimals
}

/**
 * GET /api/user/income
 * Get user's income profile
 */
export async function getIncomeProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      `SELECT
        primary_income_amount,
        primary_income_frequency,
        primary_income_source,
        additional_monthly_income,
        normalized_monthly_income,
        created_at,
        updated_at
      FROM user_income_profile
      WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return sendError(
        res,
        'Income profile not found. Please create one first.',
        'INCOME_PROFILE_NOT_FOUND',
        404
      );
    }

    const profile = result.rows[0];

    return sendSuccess(
      res,
      {
        primaryIncomeAmount: parseFloat(profile.primary_income_amount),
        primaryIncomeFrequency: profile.primary_income_frequency,
        primaryIncomeSource: profile.primary_income_source,
        additionalMonthlyIncome: parseFloat(profile.additional_monthly_income),
        normalizedMonthlyIncome: parseFloat(profile.normalized_monthly_income),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      },
      200
    );
  } catch (error: any) {
    console.error('[GET INCOME] Error fetching income profile:', error);
    return sendError(res, 'Failed to fetch income profile', 'FETCH_FAILED', 500);
  }
}

/**
 * POST /api/user/income
 * Create or update user's income profile
 */
export async function createOrUpdateIncomeProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      primaryIncomeAmount,
      primaryIncomeFrequency,
      primaryIncomeSource,
      additionalMonthlyIncome
    } = req.body;

    // Validation
    if (!primaryIncomeAmount || !primaryIncomeFrequency) {
      return sendError(
        res,
        'Primary income amount and frequency are required',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    const validFrequencies: IncomeFrequency[] = ['hourly', 'weekly', 'biweekly', 'monthly', 'annual'];
    if (!validFrequencies.includes(primaryIncomeFrequency)) {
      return sendError(
        res,
        `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`,
        'INVALID_FREQUENCY',
        400
      );
    }

    const amount = parseFloat(primaryIncomeAmount);
    const additional = parseFloat(additionalMonthlyIncome || 0);

    if (amount <= 0) {
      return sendError(
        res,
        'Primary income amount must be greater than 0',
        'INVALID_AMOUNT',
        400
      );
    }

    if (additional < 0) {
      return sendError(
        res,
        'Additional monthly income cannot be negative',
        'INVALID_ADDITIONAL_INCOME',
        400
      );
    }

    // Calculate normalized monthly income
    const normalizedPrimaryIncome = normalizeIncomeToMonthly(amount, primaryIncomeFrequency);
    const normalizedMonthlyIncome = normalizedPrimaryIncome + additional;

    // Check if profile exists
    const existingProfile = await pool.query(
      'SELECT id FROM user_income_profile WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Update existing profile
      result = await pool.query(
        `UPDATE user_income_profile
        SET
          primary_income_amount = $1,
          primary_income_frequency = $2,
          primary_income_source = $3,
          additional_monthly_income = $4,
          normalized_monthly_income = $5,
          updated_at = NOW()
        WHERE user_id = $6
        RETURNING *`,
        [
          amount,
          primaryIncomeFrequency,
          primaryIncomeSource || null,
          additional,
          normalizedMonthlyIncome,
          userId
        ]
      );
    } else {
      // Create new profile
      result = await pool.query(
        `INSERT INTO user_income_profile (
          user_id,
          primary_income_amount,
          primary_income_frequency,
          primary_income_source,
          additional_monthly_income,
          normalized_monthly_income
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          userId,
          amount,
          primaryIncomeFrequency,
          primaryIncomeSource || null,
          additional,
          normalizedMonthlyIncome
        ]
      );
    }

    const profile = result.rows[0];

    console.log(
      `[INCOME PROFILE] User ${userId} ${existingProfile.rows.length > 0 ? 'updated' : 'created'} income profile: $${normalizedMonthlyIncome}/month`
    );

    return sendSuccess(
      res,
      {
        message: `Income profile ${existingProfile.rows.length > 0 ? 'updated' : 'created'} successfully`,
        profile: {
          primaryIncomeAmount: parseFloat(profile.primary_income_amount),
          primaryIncomeFrequency: profile.primary_income_frequency,
          primaryIncomeSource: profile.primary_income_source,
          additionalMonthlyIncome: parseFloat(profile.additional_monthly_income),
          normalizedMonthlyIncome: parseFloat(profile.normalized_monthly_income),
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        }
      },
      existingProfile.rows.length > 0 ? 200 : 201
    );
  } catch (error: any) {
    console.error('[POST INCOME] Error creating/updating income profile:', error);
    return sendError(
      res,
      'Failed to create/update income profile',
      'UPDATE_FAILED',
      500
    );
  }
}

/**
 * DELETE /api/user/income
 * Delete user's income profile
 */
export async function deleteIncomeProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const result = await pool.query(
      'DELETE FROM user_income_profile WHERE user_id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return sendError(
        res,
        'Income profile not found',
        'INCOME_PROFILE_NOT_FOUND',
        404
      );
    }

    console.log(`[INCOME PROFILE] User ${userId} deleted income profile`);

    return sendSuccess(
      res,
      {
        message: 'Income profile deleted successfully'
      },
      200
    );
  } catch (error: any) {
    console.error('[DELETE INCOME] Error deleting income profile:', error);
    return sendError(res, 'Failed to delete income profile', 'DELETE_FAILED', 500);
  }
}
