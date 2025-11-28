# Story 11.2: Implement Email Delivery with Reset Link

**Epic:** Epic 11 - Password Recovery & Account Security
**Story ID:** 11.2
**Status:** ready-for-dev
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 11

---

## User Story

**As a** system,
**I want to** send password reset emails with secure links,
**So that** users can complete the password reset flow.

---

## Acceptance Criteria

### AC1: Nodemailer Configured with Gmail SMTP

**Given** a password reset token has been generated
**When** the email service is triggered
**Then** a password reset email is sent to the user

**And** Nodemailer is configured with Gmail SMTP using environment variables

### AC2: Environment Variables for Email Service

**And** environment variables are configured:
```bash
SMTP_EMAIL=your-app@gmail.com
SMTP_PASSWORD=your-app-specific-password
FRONTEND_URL=http://localhost:3000
```

### AC3: Professional Email Template with Reset Link

**And** email includes:
- Clear subject line: "Password Reset Request"
- Explanation of why they received the email
- Prominent reset button with link
- Plain text link as fallback
- Expiration warning (1 hour)
- Security note: "If you didn't request this, ignore it"
- Sender: "Smart Budget App" with from address

### AC4: Reset Link Format

**And** reset link format: `http://localhost:3000/reset-password?token=<JWT>`

### AC5: Email Delivery Error Handling

**And** email delivery errors are logged but don't expose to user

---

## Prerequisites

- Story 11.1 (token generation)

---

## Technical Notes

- Use Gmail App-Specific Password (not regular password)
- Enable "Less secure app access" in Gmail (or use OAuth2 for production)
- Consider using SendGrid or AWS SES for production (more reliable)
- Test email delivery in development with tools like Mailtrap
- Add HTML email template with inline CSS for better compatibility
- Consider text-only email version for accessibility
- Future: Use email templates from files instead of inline strings

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] EmailService class created
- [ ] Nodemailer configured
- [ ] Professional HTML email template
- [ ] Reset link includes JWT token
- [ ] Error handling for failed sends
- [ ] Test email delivery
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml

---

## Dev Agent Record

### Context Reference
- `.bmad-ephemeral/11-2-implement-email-delivery-with-reset-link.context.xml`

### Debug Log
<!-- Track implementation decisions, blockers, and solutions -->

### Completion Notes
<!-- Summary of what was implemented and any follow-ups -->

---

## File List
<!-- List of files created or modified during implementation -->

---

## Change Log
<!-- Track significant changes made to the story or implementation -->
