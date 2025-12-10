# Story 9.3: Implement Progress Calculation and Manual Allocation

**Epic:** Epic 9 - Financial Goal Tracking
**Story ID:** 9.3
**Status:** ready-for-dev
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 9

---

## User Story

**As a** user,
**I want to** manually allocate money toward my goals,
**So that** I can track my progress as I save.

---

## Acceptance Criteria

### AC1: Add Money to Goal Flow

**Given** I am viewing my goals
**When** I click "Add Money" on a goal
**Then** a modal opens to allocate money

**And** modal includes:
- Current progress: "$500 / $5,000 (10%)"
- Amount input field
- Validation: Amount > 0, doesn't exceed remaining needed
- Remaining after this allocation: "$X,XXX"
- New progress preview: "15%"
- Confirm button: "Add to Goal"

### AC2: Progress Calculation

**And** progress is recalculated:
```typescript
current_amount += allocation_amount
progress_percentage = (current_amount / target_amount) * 100
remaining = target_amount - current_amount
```

### AC3: Goal Completion

**And** when `current_amount >= target_amount`:
- Goal status automatically set to 'completed'
- Confetti animation shown 🎉
- Toast: "Goal completed! You reached [Goal Name]!"
- Badge: "Completed" on goal card

### AC4: Allocation History (Optional)

**And** allocation history tracked in `goal_allocations` table (optional):
```sql
CREATE TABLE goal_allocations (
  id SERIAL PRIMARY KEY,
  goal_id INTEGER REFERENCES goals(id),
  amount DECIMAL(10,2),
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### AC5: API Endpoint for Allocation

**And** endpoint `POST /api/goals/:id/allocate` accepts:
```json
{
  "amount": 100.50,
  "notes": "Weekly savings"
}
```

### AC6: Real-Time Progress Update

**And** goal card progress bar updates in real-time after allocation

---

## Prerequisites

- Story 9.1 (goals API)
- Story 9.2 (goals UI)

---

## Technical Notes

- Validate amount doesn't cause current_amount > target_amount
- Use transactions for allocation (ensure consistency)
- Update updated_at timestamp on allocation
- Show confetti animation on completion (react-confetti)
- Progress bar color coding:
  - 0-33%: Red
  - 34-66%: Yellow
  - 67-99%: Blue
  - 100%: Green

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Add money modal working
- [ ] Progress calculation correct
- [ ] Goal auto-completion functional
- [ ] Confetti animation on completion
- [ ] Allocation endpoint functional
- [ ] Real-time UI updates
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
