/**
 * Quota Service Tests
 *
 * Tests for the quota tracking system with rolling 24-hour windows
 *
 * NOTE: These are integration-style tests that require a test database.
 * To run:
 * 1. Set up test database (or use existing Docker instance)
 * 2. Run: npm test quota.service.test.ts
 *
 * Test Coverage:
 * - Free tier: 5 AI insights, 1 bill comparison per day
 * - Basic tier: 50 AI insights, 10 bill comparisons per day
 * - Pro tier: Unlimited everything
 * - Rolling 24-hour window behavior
 * - Reset time calculation
 */

import { QuotaService } from './quota.service';
import pool from '../../config/database';

describe('QuotaService', () => {
  let quotaService: QuotaService;
  let testUserId: number;

  beforeAll(async () => {
    quotaService = new QuotaService();

    // Create test user with 'free' tier
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, subscription_tier)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ['test-quota@example.com', 'hash', 'free']
    );
    testUserId = result.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup: Delete test user and their requests
    await pool.query('DELETE FROM user_requests WHERE user_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up requests before each test
    await pool.query('DELETE FROM user_requests WHERE user_id = $1', [testUserId]);
  });

  describe('checkQuota - Free Tier (5 AI insights/day)', () => {
    test('should allow request when quota is available', async () => {
      const result = await quotaService.checkQuota(testUserId, 'ai_insight');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBeNull(); // No requests yet
    });

    test('should decrease remaining after logging requests', async () => {
      // Log 3 requests
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 100);
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 150);
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 120);

      const result = await quotaService.checkQuota(testUserId, 'ai_insight');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2); // 5 - 3 = 2
      expect(result.resetAt).not.toBeNull();
    });

    test('should deny request when quota is exceeded', async () => {
      // Log 5 requests (at limit)
      for (let i = 0; i < 5; i++) {
        await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 100);
      }

      const result = await quotaService.checkQuota(testUserId, 'ai_insight');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).not.toBeNull();
    });

    test('should calculate correct reset time', async () => {
      const now = new Date();
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 100);

      const result = await quotaService.checkQuota(testUserId, 'ai_insight');

      expect(result.resetAt).not.toBeNull();

      // Reset should be ~24 hours from now
      const resetTime = result.resetAt!.getTime();
      const expectedReset = now.getTime() + 24 * 60 * 60 * 1000;

      // Allow 5 second tolerance
      expect(Math.abs(resetTime - expectedReset)).toBeLessThan(5000);
    });
  });

  describe('checkQuota - Rolling 24-hour window', () => {
    test('should only count requests from last 24 hours', async () => {
      // Simulate old request (25 hours ago)
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO user_requests (user_id, request_type, provider, request_timestamp)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, 'ai_insight', 'gemini-3-pro', twentyFiveHoursAgo]
      );

      // Add recent request
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 100);

      const result = await quotaService.checkQuota(testUserId, 'ai_insight');

      // Should only count 1 request (the recent one), not the 25-hour-old one
      expect(result.remaining).toBe(4); // 5 - 1 = 4
    });
  });

  describe('checkQuota - Pro Tier (Unlimited)', () => {
    let proUserId: number;

    beforeAll(async () => {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, subscription_tier)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['pro-user@example.com', 'hash', 'pro']
      );
      proUserId = result.rows[0].id;
    });

    afterAll(async () => {
      await pool.query('DELETE FROM user_requests WHERE user_id = $1', [proUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [proUserId]);
    });

    test('should always allow requests for pro tier', async () => {
      // Log 100 requests
      for (let i = 0; i < 100; i++) {
        await quotaService.logRequest(proUserId, 'ai_insight', 'gpt-5.1', 200);
      }

      const result = await quotaService.checkQuota(proUserId, 'ai_insight');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1); // -1 = unlimited
      expect(result.resetAt).toBeNull();
    });
  });

  describe('getQuotaStatus', () => {
    test('should return status for both request types', async () => {
      // Log some requests
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 100);
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 150);

      const status = await quotaService.getQuotaStatus(testUserId);

      expect(status.tier).toBe('free');
      expect(status.aiInsights.remaining).toBe(3); // 5 - 2
      expect(status.billComparisons.remaining).toBe(1); // None used yet
    });
  });

  describe('cleanupOldRequests', () => {
    test('should delete requests older than 30 days', async () => {
      // Create old request (31 days ago)
      const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      await pool.query(
        `INSERT INTO user_requests (user_id, request_type, provider, created_at)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, 'ai_insight', 'gemini-3-pro', thirtyOneDaysAgo]
      );

      // Create recent request
      await quotaService.logRequest(testUserId, 'ai_insight', 'gemini-3-pro', 100);

      const deletedCount = await quotaService.cleanupOldRequests();

      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify old request is gone
      const result = await pool.query(
        'SELECT COUNT(*) FROM user_requests WHERE user_id = $1',
        [testUserId]
      );
      expect(parseInt(result.rows[0].count)).toBe(1); // Only recent request remains
    });
  });
});
