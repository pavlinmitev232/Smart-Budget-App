# Story 6.3: Build Contact Form with Email Delivery

**Epic:** Epic 6 - Public Landing Page & Lead Generation
**Story ID:** 6.3
**Status:** done
**Created:** 2025-11-25
**Completed:** 2025-11-30
**Sprint:** Phase 2, Epic 6

---

## User Story

**As a** visitor,
**I want to** submit a contact/inquiry message,
**So that** I can reach out with questions or feedback.

---

## Acceptance Criteria

### AC1: Contact Form Fields

**Given** I am on the landing page Contact section
**When** I fill out and submit the contact form
**Then** my message is sent to the app owner's email

**And** the contact form includes:
- Name input (required, text)
- Email input (required, email validation)
- Subject dropdown (optional): "General Inquiry", "Feature Request", "Bug Report", "Partnership", "Other"
- Message textarea (required, 500 char max)
- Submit button: "Send Message"
- Success message area
- reCAPTCHA (optional - to prevent spam)

### AC2: Frontend Validation

**And** frontend validation:
- Name: Min 2 characters, max 100
- Email: Valid email format
- Message: Min 10 characters, max 500

### AC3: Contact Submissions Table

**And** contact submissions are stored in database:
```sql
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### AC4: Email Notifications

**And** email is sent to app owner AND confirmation email sent to submitter

### AC5: Successful Submission UX

**And** on successful submission:
- Form is cleared
- Success toast appears
- Green checkmark icon shown
- Message: "Message sent successfully!"

### AC6: Rate Limiting and Spam Prevention

**And** rate limiting:
- Max 3 submissions per IP per hour
- Max 10 submissions per email per day

**And** spam prevention:
- Honeypot field (hidden input that bots fill)
- Time-based check (reject if submitted < 3 seconds)
- Block common spam keywords

---

## Prerequisites

- Story 6.1 (landing page exists)
- Story 11.2 (email service exists)

---

## Technical Notes

- Reuse EmailService from Epic 11
- Use environment variable for owner email: `CONTACT_EMAIL`
- Validate email server-side (don't trust client)
- Consider adding Google reCAPTCHA v3 (invisible)
- Log all contact submissions for analytics
- Admin panel to view submissions (future enhancement)
- Consider webhook to Slack/Discord for instant notifications
- Auto-reply should be plain text + HTML version

---

## Definition of Done

- [x] All acceptance criteria pass
- [x] Contact form component created
- [x] API endpoint for submissions
- [x] Database table created
- [x] Email delivery working
- [x] Rate limiting implemented
- [x] Spam prevention measures active
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Code reviewed
- [x] Story marked 'done' in sprint-status.yaml
