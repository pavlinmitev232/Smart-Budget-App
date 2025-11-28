# Story 11.3: Create Reset Password Form and Validation

**Epic:** Epic 11 - Password Recovery & Account Security
**Story ID:** 11.3
**Status:** ready-for-dev
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 11

---

## User Story

**As a** user,
**I want to** submit a new password via the reset link,
**So that** I can regain access to my account with a new password.

---

## Acceptance Criteria

### AC1: Reset Password Page with Form

**Given** I received a password reset email
**When** I click the reset link
**Then** I am taken to a password reset form

**And** the frontend route exists: `/reset-password?token=<JWT>`

### AC2: Form Fields and Requirements

**And** the reset password form includes:
- New password input (type="password")
- Confirm password input (type="password")
- Show/hide password toggle
- Submit button: "Reset Password"
- Password requirements displayed:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character

### AC3: Frontend Validation

**And** frontend validation:
- Passwords match
- Password meets requirements
- Token exists in URL

### AC4: Reset Password API Endpoint

**And** the endpoint `/api/auth/reset-password` accepts:
```json
{
  "token": "<JWT_TOKEN>",
  "newPassword": "NewSecurePass123!"
}
```

### AC5: Backend Token Validation

**And** the backend validates:
- Token is valid JWT
- Token signature is correct
- Token is not expired
- Token exists in `password_reset_tokens` table
- Token has not been used
- New password meets requirements

### AC6: Successful Password Reset

**And** after successful reset:
- User is redirected to login page
- Success toast: "Password reset successful! Please log in."
- Old password no longer works
- Reset token is deleted (cannot be reused)

### AC7: Invalid/Expired Token Handling

**And** invalid/expired token shows error page:
```
Reset Link Invalid or Expired

This password reset link is no longer valid. It may have expired or already been used.

[Request New Reset Link]
```

---

## Prerequisites

- Story 11.1 (token generation)
- Story 11.2 (email delivery)
- Story 2.1 (password hashing)

---

## Technical Notes

- Use React Hook Form for form validation
- Show password strength indicator
- Client-side validation before API call
- Secure token transmission (HTTPS in production)
- Log successful password resets for security
- Consider adding "Sign in" link on success page
- Future enhancement: Force logout all sessions after password reset
- Consider rate limiting reset attempts (prevent brute force)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Reset password page created
- [ ] Form with validation implemented
- [ ] API endpoint validates token and updates password
- [ ] Password hashing with bcrypt
- [ ] Token deleted after use
- [ ] Success/error flows working
- [ ] Unit tests pass (frontend + backend)
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml

---

## Dev Agent Record

### Context Reference
- `.bmad-ephemeral/11-3-create-reset-password-form-and-validation.context.xml`

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
