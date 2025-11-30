/**
 * Unit tests for EmailService
 *
 * Tests email sending functionality with mocked nodemailer transport
 * to avoid actually sending emails during tests.
 */

import { EmailService } from './email.service';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSendMail: jest.Mock;
  let mockTransporter: any;

  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to clear any cached instances
    jest.resetModules();

    // Set up mock environment variables
    process.env = {
      ...originalEnv,
      SMTP_EMAIL: 'test@gmail.com',
      SMTP_PASSWORD: 'test-app-password',
      FRONTEND_URL: 'http://localhost:3000',
    };

    // Create mock sendMail function
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });

    // Create mock transporter
    mockTransporter = {
      sendMail: mockSendMail,
    };

    // Mock nodemailer.createTransport to return our mock transporter
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    // Create a fresh instance of EmailService
    emailService = new EmailService();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error if SMTP_EMAIL is missing', () => {
      delete process.env.SMTP_EMAIL;
      expect(() => new EmailService()).toThrow(
        'Email service configuration error: SMTP_EMAIL, SMTP_PASSWORD, and FRONTEND_URL must be set in environment variables'
      );
    });

    it('should throw error if SMTP_PASSWORD is missing', () => {
      delete process.env.SMTP_PASSWORD;
      expect(() => new EmailService()).toThrow(
        'Email service configuration error: SMTP_EMAIL, SMTP_PASSWORD, and FRONTEND_URL must be set in environment variables'
      );
    });

    it('should throw error if FRONTEND_URL is missing', () => {
      delete process.env.FRONTEND_URL;
      expect(() => new EmailService()).toThrow(
        'Email service configuration error: SMTP_EMAIL, SMTP_PASSWORD, and FRONTEND_URL must be set in environment variables'
      );
    });

    it('should initialize with correct SMTP configuration', () => {
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@gmail.com',
          pass: 'test-app-password',
        },
      });
    });
  });

  describe('sendPasswordReset', () => {
    const testEmail = 'user@example.com';
    const testToken = 'test-jwt-token-abc123';

    it('should send email with correct recipient and subject', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const emailOptions = mockSendMail.mock.calls[0][0];

      expect(emailOptions.to).toBe(testEmail);
      expect(emailOptions.subject).toBe('Password Reset Request');
      expect(emailOptions.from).toBe('"Smart Budget App" <test@gmail.com>');
    });

    it('should include reset link with correct format in email', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];
      const expectedLink = `http://localhost:3000/reset-password?token=${testToken}`;

      // Check HTML version contains the link
      expect(emailOptions.html).toContain(expectedLink);

      // Check plain text version contains the link
      expect(emailOptions.text).toContain(expectedLink);
    });

    it('should include 1-hour expiration warning in email', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];

      // Check HTML version mentions expiration
      expect(emailOptions.html).toContain('1 hour');

      // Check plain text version mentions expiration
      expect(emailOptions.text).toContain('1 hour');
    });

    it('should include security notice in email', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];

      // Check HTML version has security notice
      expect(emailOptions.html).toContain('didn\'t request');
      expect(emailOptions.html).toContain('ignore');

      // Check plain text version has security notice
      expect(emailOptions.text).toContain('didn\'t request');
      expect(emailOptions.text).toContain('ignore');
    });

    it('should include both HTML and plain text versions', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];

      expect(emailOptions.html).toBeDefined();
      expect(emailOptions.text).toBeDefined();
      expect(typeof emailOptions.html).toBe('string');
      expect(typeof emailOptions.text).toBe('string');
      expect(emailOptions.html.length).toBeGreaterThan(0);
      expect(emailOptions.text.length).toBeGreaterThan(0);
    });

    it('should include reset button in HTML version', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];

      // Check for button text
      expect(emailOptions.html).toContain('Reset Your Password');

      // Check for link/anchor tag
      expect(emailOptions.html).toContain('<a href=');
    });

    it('should use branded sender name', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];

      expect(emailOptions.from).toContain('Smart Budget App');
    });

    it('should not throw error when email sending fails', async () => {
      // Mock sendMail to reject
      mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      // Should not throw - errors are caught internally
      await expect(
        emailService.sendPasswordReset(testEmail, testToken)
      ).resolves.toBeUndefined();
    });

    it('should log error when email sending fails', async () => {
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock sendMail to reject
      const testError = new Error('SMTP connection failed');
      mockSendMail.mockRejectedValueOnce(testError);

      await emailService.sendPasswordReset(testEmail, testToken);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL ERROR]'),
        testError
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log success when email is sent', async () => {
      // Spy on console.log
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await emailService.sendPasswordReset(testEmail, testToken);

      // Verify success was logged (expects single formatted string argument)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL] Password reset email sent successfully')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('Email Template Content', () => {
    const testEmail = 'user@example.com';
    const testToken = 'test-token';

    it('should include current year in footer', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];
      const currentYear = new Date().getFullYear().toString();

      expect(emailOptions.html).toContain(currentYear);
      expect(emailOptions.text).toContain(currentYear);
    });

    it('should have properly formatted HTML with inline styles', async () => {
      await emailService.sendPasswordReset(testEmail, testToken);

      const emailOptions = mockSendMail.mock.calls[0][0];

      // Check for inline CSS (email client compatibility)
      expect(emailOptions.html).toContain('style=');

      // Check for HTML structure
      expect(emailOptions.html).toContain('<!DOCTYPE html>');
      expect(emailOptions.html).toContain('<table');
    });
  });
});
