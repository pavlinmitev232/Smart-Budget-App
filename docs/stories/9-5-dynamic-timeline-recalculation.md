# Story 9.5: Dynamic Timeline Recalculation

**Epic:** Epic 9 - Financial Goal Tracking
**Story ID:** 9.5
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 9

---

## User Story

**As a** user,
**I want** my goal timelines to update automatically when my income or spending changes,
**So that** I have accurate projections of when I'll reach my goals.

---

## Acceptance Criteria

### AC1: Timeline Recalculation Triggers

**Given** I have active goals with income profile configured
**When** my income or expense patterns change
**Then** goal timelines are automatically recalculated

**And** recalculation triggers:
- Income profile updated (Story 8.2)
- Significant expense pattern change detected (±20% month-over-month)
- Manual trigger: "Recalculate Timelines" button

### AC2: Savings Capacity Calculation

**And** savings capacity calculated:
```typescript
monthly_income = normalized_monthly_income
avg_monthly_expenses = average of last 3 months expenses
available_for_savings = monthly_income - avg_monthly_expenses
months_to_goal = (target_amount - current_amount) / available_for_savings
projected_completion = current_date + months_to_goal
```

### AC3: Updated Projections Displayed

**And** updated projections shown on goal cards:
- "Projected completion: March 2026"
- "At current rate: 8 months"
- "Monthly savings needed: $500"

### AC4: Notification When Timeline Improves

**And** notification when timeline changes significantly (> 1 month):
```
🎯 Great News!

Your "Emergency Fund" goal timeline improved by 3 months!

You'll now reach your goal by May 2026 instead of August 2026.

Reason: Income increased / Expenses decreased

[View Details]
```

### AC5: Warning When Timeline Worsens

**And** warning when timeline worsens:
```
⚠️ Goal Timeline Extended

Your "Vacation Fund" completion delayed by 2 months.

New projected date: September 2026

Reason: Expenses increased by 15%

AI Suggestion: Reduce "Entertainment" by $200/month to get back on track.

[View Suggestions]
```

---

## Prerequisites

- Story 9.4 (goals dashboard)
- Story 8.1 (income profile)

---

## Technical Notes

- Background job runs weekly to recalculate all active goals
- Use last 3 months of expense data for average
- Compare new timeline with old timeline
- Create notification if change > 1 month
- Include AI suggestion in worsening notifications
- Store timeline snapshots for trend analysis (optional)
- Handle edge cases: No income profile, irregular income, etc.

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Savings capacity calculation correct
- [ ] Timeline recalculation working
- [ ] Projections displayed on goal cards
- [ ] Notifications for timeline changes
- [ ] AI suggestions included
- [ ] Background job scheduled
- [ ] Edge cases handled
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
