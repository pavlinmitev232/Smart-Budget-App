# Story 9.5: Dynamic Timeline Recalculation

**Epic:** Epic 9 - Financial Goal Tracking
**Story ID:** 9.5
**Status:** done
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

## Tasks/Subtasks

- [x] **Task 1: Create Timeline Service (Backend)**
  - [x] Create `timeline.service.ts` with savings capacity calculation
  - [x] Implement `recalculateGoalTimelines()` function
  - [x] Add expense change detection (±20% month-over-month)
  - [x] Store previous timeline for comparison

- [x] **Task 2: Add Timeline API Endpoints**
  - [x] Add `POST /api/goals/recalculate` endpoint for manual trigger
  - [x] Extend goal response with projection fields
  - [x] Hook into income profile update to trigger recalculation

- [x] **Task 3: Create Timeline Notifications**
  - [x] Create notification types for timeline changes
  - [x] Store notifications in database
  - [x] Add `GET /api/notifications` endpoint
  - [x] Include AI suggestions for worsening timelines

- [x] **Task 4: Update Frontend Goal Cards**
  - [x] Display projected completion date
  - [x] Display months to goal
  - [x] Display monthly savings needed
  - [x] Add "Recalculate Timelines" button

- [x] **Task 5: Implement Notification Display**
  - [x] Create notification banner component
  - [x] Show timeline improvement/worsening alerts
  - [x] Add "View Details" action

- [x] **Task 6: Background Job Setup**
  - [x] Create weekly recalculation job using pg_cron
  - [x] Process all users with active goals

- [x] **Task 7: Edge Cases and Testing**
  - [x] Handle no income profile scenario
  - [x] Handle zero/negative savings capacity
  - [x] Handle goals without deadlines
  - [x] Write unit tests for timeline calculations

---

## Dev Agent Record

### Debug Log
- Starting implementation: 2025-12-10
- Explored existing goals and income profile code structure
- Created timeline.service.ts with savings capacity calculation
- Added timeline recalculation API endpoints
- Created notifications service and routes
- Updated frontend Goals page with projections display
- Created NotificationBanner component for navigation
- Implemented background job infrastructure
- Added comprehensive unit tests (11 passing)

### Completion Notes
Implementation complete for all acceptance criteria:
- AC1: Timeline recalculation triggers on income profile update, expense change detection, and manual button
- AC2: Savings capacity calculated using normalized monthly income and 3-month expense average
- AC3: Projections displayed on goal cards with completion date, months to goal, and savings needed
- AC4: Improvement notifications created when timeline improves by >1 month
- AC5: Worsening warnings include AI suggestions for getting back on track
- Background job infrastructure ready (pg_cron or manual execution)
- Edge cases handled: no income profile, zero savings, completed goals

---

## File List

**Backend (New):**
- `backend/src/features/goals/timeline.service.ts` - Timeline calculation service
- `backend/src/features/goals/timeline.controller.ts` - Timeline API endpoints
- `backend/src/features/goals/timeline.service.test.ts` - Unit tests (11 passing)
- `backend/src/features/goals/timeline.cron.ts` - Background job implementation
- `backend/src/features/goals/notifications.service.ts` - Notifications service
- `backend/src/features/goals/notifications.routes.ts` - Notifications API routes
- `backend/src/features/goals/setup-timeline-tables.ts` - Database table setup

**Backend (Modified):**
- `backend/src/features/goals/goals.routes.ts` - Added timeline endpoints
- `backend/src/features/income/income.controller.ts` - Added timeline trigger on income update
- `backend/src/index.ts` - Registered notifications routes

**Frontend (New):**
- `frontend/src/components/NotificationBanner.tsx` - Notification bell component

**Frontend (Modified):**
- `frontend/src/pages/Goals.tsx` - Added projections display and recalculate button
- `frontend/src/components/Navigation.tsx` - Added notification banner

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-10 | Started implementation | Dev Agent |
| 2025-12-10 | Created timeline service with savings calculation | Dev Agent |
| 2025-12-10 | Added API endpoints for recalculation | Dev Agent |
| 2025-12-10 | Created notifications system | Dev Agent |
| 2025-12-10 | Updated frontend with projections display | Dev Agent |
| 2025-12-10 | Added background job infrastructure | Dev Agent |
| 2025-12-10 | Wrote unit tests (11 passing) | Dev Agent |
| 2025-12-10 | Completed implementation, ready for review | Dev Agent |
| 2025-12-10 | Fixed JSONB metadata parsing bug in notifications.service.ts | Dev Agent |
| 2025-12-10 | Integration tests passed, story marked done | Dev Agent |

---

## Definition of Done

- [x] All acceptance criteria pass
- [x] Savings capacity calculation correct
- [x] Timeline recalculation working
- [x] Projections displayed on goal cards
- [x] Notifications for timeline changes
- [x] AI suggestions included
- [x] Background job scheduled
- [x] Edge cases handled
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Code reviewed
- [x] Story marked 'done' in sprint-status.yaml
