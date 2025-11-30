import nodemailer, { Transporter } from 'nodemailer';

/**
 * EmailService - Handles all email delivery for the application
 *
 * Configured to use Gmail SMTP for sending emails.
 * All email failures are logged but don't propagate errors to maintain security
 * (prevents email enumeration attacks).
 */
export class EmailService {
  private transporter: Transporter;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    // Validate required environment variables
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!smtpEmail || !smtpPassword || !frontendUrl) {
      throw new Error(
        'Email service configuration error: SMTP_EMAIL, SMTP_PASSWORD, and FRONTEND_URL must be set in environment variables'
      );
    }

    this.fromEmail = smtpEmail;
    this.frontendUrl = frontendUrl;

    // Configure Gmail SMTP transport
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS (STARTTLS)
      auth: {
        user: smtpEmail,
        pass: smtpPassword, // App-specific password for Gmail
      },
    });

    console.log('✉️  Email service initialized with Gmail SMTP');
  }

  /**
   * Sends a contact form notification to the app owner
   *
   * @param to - Owner's email address
   * @param data - Contact form submission data
   */
  async sendContactNotification(
    to: string,
    data: {
      name: string;
      email: string;
      subject: string;
      message: string;
      submissionId: number;
    }
  ): Promise<void> {
    const htmlTemplate = this.getContactNotificationHtmlTemplate(data);
    const textTemplate = this.getContactNotificationTextTemplate(data);

    try {
      await this.transporter.sendMail({
        from: `"Smart Budget App" <${this.fromEmail}>`,
        to,
        subject: `New Contact Form Submission: ${data.subject}`,
        text: textTemplate,
        html: htmlTemplate,
        replyTo: data.email, // Allow owner to reply directly
      });

      console.log(`[EMAIL] Contact notification sent to: ${to} (Submission ID: ${data.submissionId})`);
    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send contact notification to ${to}:`, error);
      // Don't throw - email failures should not block the contact form submission
    }
  }

  /**
   * Sends a confirmation email to the contact form submitter
   *
   * @param to - Submitter's email address
   * @param name - Submitter's name
   */
  async sendContactConfirmation(to: string, name: string): Promise<void> {
    const htmlTemplate = this.getContactConfirmationHtmlTemplate(name);
    const textTemplate = this.getContactConfirmationTextTemplate(name);

    try {
      await this.transporter.sendMail({
        from: `"Smart Budget App" <${this.fromEmail}>`,
        to,
        subject: 'Thank you for contacting Smart Budget App',
        text: textTemplate,
        html: htmlTemplate,
      });

      console.log(`[EMAIL] Contact confirmation sent to: ${to}`);
    } catch (error) {
      console.error(`[EMAIL ERROR] Failed to send contact confirmation to ${to}:`, error);
      // Don't throw - email failures should not block the contact form submission
    }
  }

  /**
   * Sends a password reset email with a secure JWT token link
   *
   * @param to - Recipient email address
   * @param resetToken - JWT token for password reset
   *
   * Error handling: Logs failures but does not throw errors to prevent
   * email enumeration attacks. Always appears successful to the caller.
   */
  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const htmlTemplate = this.getPasswordResetHtmlTemplate(resetLink);
    const textTemplate = this.getPasswordResetTextTemplate(resetLink);

    try {
      await this.transporter.sendMail({
        from: `"Smart Budget App" <${this.fromEmail}>`,
        to,
        subject: 'Password Reset Request',
        text: textTemplate,
        html: htmlTemplate,
      });

      console.log(`[EMAIL] Password reset email sent successfully to: ${to}`);
    } catch (error) {
      // Log the error for debugging but DO NOT throw
      // This prevents email enumeration attacks
      console.error(`[EMAIL ERROR] Failed to send password reset email to ${to}:`, error);

      // Do not re-throw - caller should always think email was sent successfully
    }
  }

  /**
   * HTML email template for contact notification to owner
   */
  private getContactNotificationHtmlTemplate(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    submissionId: number;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #4f46e5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">New Contact Submission</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">${data.subject}</h2>

              <div style="margin: 20px 0; padding: 16px; background-color: #f9fafb; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">
                  <strong>From:</strong> ${data.name}
                </p>
                <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">
                  <strong>Email:</strong> <a href="mailto:${data.email}" style="color: #4f46e5;">${data.email}</a>
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 14px;">
                  <strong>Submission ID:</strong> #${data.submissionId}
                </p>
              </div>

              <div style="margin: 20px 0; padding: 20px; background-color: #f3f4f6; border-left: 4px solid #4f46e5; border-radius: 4px;">
                <p style="margin: 0; color: #1f2937; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}"
                   style="display: inline-block; padding: 16px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                  Reply to ${data.name}
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent by Smart Budget App Contact Form<br>
                © ${new Date().getFullYear()} Smart Budget App. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Plain text email template for contact notification
   */
  private getContactNotificationTextTemplate(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    submissionId: number;
  }): string {
    return `
Smart Budget App - New Contact Form Submission

Subject: ${data.subject}

From: ${data.name}
Email: ${data.email}
Submission ID: #${data.submissionId}

Message:
${data.message}

---
Reply to this email to respond to ${data.name}.

Smart Budget App
© ${new Date().getFullYear()} Smart Budget App. All rights reserved.
    `.trim();
  }

  /**
   * HTML email template for contact confirmation to submitter
   */
  private getContactConfirmationHtmlTemplate(name: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting Us</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #10b981; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Message Received!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Thank You, ${name}!</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We've received your message and appreciate you reaching out to us.
              </p>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.
              </p>

              <div style="margin: 30px 0; padding: 16px; background-color: #ecfdf5; border-left: 4px solid: #10b981; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  <strong>✓ Confirmation</strong><br>
                  Your message has been successfully submitted and logged in our system.
                </p>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <a href="${this.frontendUrl}"
                   style="display: inline-block; padding: 16px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                  Visit Smart Budget App
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated confirmation email from Smart Budget App<br>
                © ${new Date().getFullYear()} Smart Budget App. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Plain text email template for contact confirmation
   */
  private getContactConfirmationTextTemplate(name: string): string {
    return `
Smart Budget App - Thank You for Contacting Us

Hello ${name},

We've received your message and appreciate you reaching out to us.

Our team will review your inquiry and get back to you as soon as possible, typically within 1-2 business days.

✓ CONFIRMATION
Your message has been successfully submitted and logged in our system.

---
Smart Budget App
${this.frontendUrl}

© ${new Date().getFullYear()} Smart Budget App. All rights reserved.
    `.trim();
  }

  /**
   * HTML email template for password reset
   * Uses inline CSS for better email client compatibility
   */
  private getPasswordResetHtmlTemplate(resetLink: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #4f46e5; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Smart Budget App</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Password Reset Request</h2>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                Hello,
              </p>

              <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your Smart Budget App account.
                Click the button below to create a new password:
              </p>

              <!-- Reset Button -->
              <table role="presentation" style="margin: 30px 0; border-collapse: collapse;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${resetLink}"
                       style="display: inline-block; padding: 16px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      Reset Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>

              <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f4f4f4; border-radius: 4px; color: #4f46e5; font-size: 14px; word-break: break-all;">
                ${resetLink}
              </p>

              <!-- Expiration Warning -->
              <div style="margin: 30px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">
                  ⏰ This link expires in 1 hour
                </p>
              </div>

              <!-- Security Notice -->
              <div style="margin: 20px 0; padding: 16px; background-color: #f3f4f6; border-radius: 4px;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                  <strong>Security Notice:</strong> If you didn't request this password reset,
                  you can safely ignore this email. Your password will not be changed.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent by Smart Budget App<br>
                © ${new Date().getFullYear()} Smart Budget App. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Plain text email template for password reset
   * Fallback for email clients that don't support HTML
   */
  private getPasswordResetTextTemplate(resetLink: string): string {
    return `
Smart Budget App - Password Reset Request

Hello,

We received a request to reset your password for your Smart Budget App account.

To reset your password, click the link below or copy and paste it into your browser:

${resetLink}

IMPORTANT: This link expires in 1 hour.

SECURITY NOTICE:
If you didn't request this password reset, you can safely ignore this email.
Your password will not be changed.

---
Smart Budget App
© ${new Date().getFullYear()} Smart Budget App. All rights reserved.
    `.trim();
  }
}

// Export a singleton instance - lazy initialization
let emailServiceInstance: EmailService | null = null;

export const emailService = {
  sendPasswordReset: async (to: string, resetToken: string): Promise<void> => {
    if (!emailServiceInstance) {
      emailServiceInstance = new EmailService();
    }
    return emailServiceInstance.sendPasswordReset(to, resetToken);
  },
  sendContactNotification: async (
    to: string,
    data: {
      name: string;
      email: string;
      subject: string;
      message: string;
      submissionId: number;
    }
  ): Promise<void> => {
    if (!emailServiceInstance) {
      emailServiceInstance = new EmailService();
    }
    return emailServiceInstance.sendContactNotification(to, data);
  },
  sendContactConfirmation: async (to: string, name: string): Promise<void> => {
    if (!emailServiceInstance) {
      emailServiceInstance = new EmailService();
    }
    return emailServiceInstance.sendContactConfirmation(to, name);
  },
};
