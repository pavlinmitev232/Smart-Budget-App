# Story 9.2: Build Goal Creation and Management UI

**Epic:** Epic 9 - Financial Goal Tracking
**Story ID:** 9.2
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 9

---

## User Story

**As a** user,
**I want to** create and manage my financial goals through a UI,
**So that** I can easily track what I'm saving for.

---

## Acceptance Criteria

### AC1: Create Goal Form

**Given** I am on the Goals page
**When** I click "Create Goal"
**Then** a modal opens with a goal creation form

**And** form fields:
- Goal name (required, e.g., "Emergency Fund")
- Goal type (dropdown: Savings, Purchase, Debt Payoff)
- Target amount (number, required)
- Deadline (date picker, optional)
- Priority (dropdown: High, Medium, Low)
- Initial amount (optional, starts at $0 if not provided)

### AC2: Goals Dashboard List View

**And** Goals dashboard displays:
- List of active goals
- Each goal card shows:
  - Name and icon (based on type)
  - Progress bar with percentage
  - Current amount / Target amount
  - Deadline (days remaining or "No deadline")
  - Priority badge
  - Quick actions: Add Money, Edit, Delete

### AC3: Sorting and Filtering

**And** goals can be sorted by:
- Priority (high → low)
- Deadline (soonest first)
- Progress (highest → lowest)

**And** filter by status:
- Active (default)
- Completed
- Paused
- All

### AC4: Tier Limit Enforcement

**And** tier limit enforced:
- Free tier: Message when trying to create 4th goal: "Upgrade to Basic for 10 goals or Pro for unlimited"
- Button disabled when limit reached
- Show tier limit indicator: "2/3 goals used"

### AC5: Empty State

**And** empty state shown when no goals exist:
```
No Goals Yet

Start tracking your financial goals today!

[Create Your First Goal]
```

---

## Prerequisites

- Story 9.1 (goals API)

---

## Technical Notes

- Use React Hook Form for form validation
- Modal for create/edit goal
- Confirm dialog for delete
- Disable deadline in past
- Show tier upgrade prompt when limit reached
- Responsive design: Grid on desktop, list on mobile

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Create goal form working
- [ ] Goals list displays correctly
- [ ] Sorting and filtering functional
- [ ] Tier limits enforced
- [ ] Empty state displayed
- [ ] Quick actions working
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
