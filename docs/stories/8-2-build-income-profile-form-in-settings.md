# Story 8.2: Build Income Profile Form in Settings

**Epic:** Epic 8 - Income Profile & AI Budget Recommendations
**Story ID:** 8.2
**Status:** done
**Created:** 2025-11-25
**Completed:** 2025-11-30
**Sprint:** Phase 2, Epic 8

---

## User Story

**As a** user,
**I want to** enter my income information in Settings,
**So that** AI can provide budget recommendations tailored to my earnings.

---

## Acceptance Criteria

### AC1: Income Profile Form in Settings

**Given** I am logged in
**When** I navigate to Settings > Income Profile
**Then** I see a form to enter my income information

### AC2: Form Fields

**And** form includes:
- Primary income amount (number, required)
- Frequency dropdown (Hourly, Weekly, Biweekly, Monthly, Annual)
- Income source (text: "Acme Corp", "Self-employed", etc.)
- Additional monthly income (number, optional, help text: "Freelance, investments, etc.")
- Calculated display: "Your monthly income: $X,XXX" (real-time calculation)
- Save button
- "Skip for now" option

### AC3: Real-Time Calculation Preview

**And** monthly income preview updates in real-time as user changes amount or frequency

### AC4: Help Text and Privacy Note

**And** help text explains: "Income helps AI provide personalized budget recommendations"

**And** privacy note: "Your income is private and never shared"

### AC5: Form Validation

**And** validation:
- Income amount > 0
- Frequency selected
- Source name: 2-100 characters

### AC6: Success Feedback

**And** on successful save:
- Toast: "Income profile saved!"
- Form shows current values
- Option to edit or delete

---

## Prerequisites

- Story 8.1 (income API)
- Settings page structure

---

## Technical Notes

- Use React Hook Form for validation
- Real-time calculation uses normalization logic from 8.1
- Store/update via POST /api/user/income
- Delete button removes profile (sets to null)
- Optional field: Can skip and complete later
- Pre-fill form if income profile exists

---

## Definition of Done

- [x] All acceptance criteria pass
- [x] Form component created
- [x] Real-time calculation working
- [x] Validation functional
- [x] API integration complete
- [x] Help text and privacy note displayed
- [x] Manual tests pass
- [x] Code reviewed
- [x] Story marked 'done' in sprint-status.yaml
