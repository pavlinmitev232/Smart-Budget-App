import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { emailService } from '../services/email.service';

const router = Router();

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if message contains common spam keywords
 */
function containsSpamKeywords(message: string): boolean {
  const spamKeywords = [
    'viagra',
    'cialis',
    'casino',
    'lottery',
    'winner',
    'click here',
    'buy now',
    'limited time',
    'act now',
    'free money',
    'make money fast',
  ];

  const lowerMessage = message.toLowerCase();
  return spamKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Rate Limiting Check - IP-based
 * Max 3 submissions per IP per hour
 */
async function checkIpRateLimit(ipAddress: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await pool.query(
    `SELECT COUNT(*) FROM contact_submissions
     WHERE ip_address = $1 AND created_at > $2`,
    [ipAddress, oneHourAgo]
  );

  const count = parseInt(result.rows[0].count, 10);
  return count >= 3; // Returns true if rate limit exceeded
}

/**
 * Rate Limiting Check - Email-based
 * Max 10 submissions per email per day
 */
async function checkEmailRateLimit(email: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await pool.query(
    `SELECT COUNT(*) FROM contact_submissions
     WHERE email = $1 AND created_at > $2`,
    [email, oneDayAgo]
  );

  const count = parseInt(result.rows[0].count, 10);
  return count >= 10; // Returns true if rate limit exceeded
}

/**
 * Contact Form Submission Endpoint
 * POST /api/contact
 *
 * Accepts contact form submissions, stores them, and sends email notifications
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, honeypot, submissionTime } = req.body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SPAM PREVENTION: Honeypot Field
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // If honeypot field is filled, it's likely a bot
    if (honeypot) {
      console.log('[SPAM] Honeypot field filled - rejecting submission');
      // Return success to avoid revealing spam detection
      return sendSuccess(res, { message: 'Message sent successfully' }, 200);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SPAM PREVENTION: Time-based Check
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Reject if submitted too quickly (< 3 seconds)
    if (submissionTime && submissionTime < 3000) {
      console.log('[SPAM] Form submitted too quickly - rejecting submission');
      // Return success to avoid revealing spam detection
      return sendSuccess(res, { message: 'Message sent successfully' }, 200);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // INPUT VALIDATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Check required fields
    if (!name || !email || !message) {
      return sendError(
        res,
        'Name, email, and message are required',
        'MISSING_FIELDS',
        400
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return sendError(
        res,
        'Name must be between 2 and 100 characters',
        'INVALID_NAME',
        400
      );
    }

    // Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      return sendError(
        res,
        'Invalid email format',
        'INVALID_EMAIL',
        400
      );
    }

    // Validate message length
    if (message.length < 10 || message.length > 500) {
      return sendError(
        res,
        'Message must be between 10 and 500 characters',
        'INVALID_MESSAGE',
        400
      );
    }

    // Validate subject if provided
    if (subject && subject.length > 100) {
      return sendError(
        res,
        'Subject must not exceed 100 characters',
        'INVALID_SUBJECT',
        400
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SPAM PREVENTION: Keyword Detection
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (containsSpamKeywords(message)) {
      console.log('[SPAM] Spam keywords detected - rejecting submission');
      // Return success to avoid revealing spam detection
      return sendSuccess(res, { message: 'Message sent successfully' }, 200);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // RATE LIMITING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Get submitter's IP address
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Check IP rate limit (3 per hour)
    const ipLimitExceeded = await checkIpRateLimit(ipAddress);
    if (ipLimitExceeded) {
      return sendError(
        res,
        'Too many submissions from this IP address. Please try again later.',
        'RATE_LIMIT_IP',
        429
      );
    }

    // Check email rate limit (10 per day)
    const emailLimitExceeded = await checkEmailRateLimit(normalizedEmail);
    if (emailLimitExceeded) {
      return sendError(
        res,
        'Too many submissions from this email address. Please try again later.',
        'RATE_LIMIT_EMAIL',
        429
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // STORE SUBMISSION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await pool.query(
      `INSERT INTO contact_submissions
       (name, email, subject, message, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [name.trim(), normalizedEmail, subject || null, message.trim(), ipAddress, userAgent]
    );

    const submission = result.rows[0];

    console.log(`[CONTACT] New submission from ${normalizedEmail} (ID: ${submission.id})`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // SEND EMAIL NOTIFICATIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Send notification to app owner (in background - don't wait)
    const ownerEmail = process.env.CONTACT_EMAIL || process.env.SMTP_EMAIL;
    if (ownerEmail) {
      emailService
        .sendContactNotification(ownerEmail, {
          name: name.trim(),
          email: normalizedEmail,
          subject: subject || 'No subject',
          message: message.trim(),
          submissionId: submission.id,
        })
        .catch((error) => {
          console.error('[EMAIL ERROR] Failed to send owner notification:', error);
        });
    }

    // Send confirmation email to submitter (in background - don't wait)
    emailService
      .sendContactConfirmation(normalizedEmail, name.trim())
      .catch((error) => {
        console.error('[EMAIL ERROR] Failed to send confirmation email:', error);
      });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // RETURN SUCCESS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    return sendSuccess(
      res,
      {
        message: 'Message sent successfully',
        submissionId: submission.id,
      },
      201
    );
  } catch (error) {
    console.error('[CONTACT ERROR] Failed to process contact form:', error);
    return sendError(
      res,
      'Failed to send message. Please try again later.',
      'SUBMISSION_FAILED',
      500
    );
  }
});

export default router;
