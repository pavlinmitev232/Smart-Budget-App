# Story 9.4: Build Goals Dashboard with Visualizations

**Epic:** Epic 9 - Financial Goal Tracking
**Story ID:** 9.4
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 9

---

## User Story

**As a** user,
**I want to** see visual representations of my goals progress,
**So that** I can quickly understand how close I am to achieving them.

---

## Acceptance Criteria

### AC1: Goals Overview Summary Cards

**Given** I have active goals
**When** I view the Goals dashboard
**Then** I see overview summary cards at the top

**And** summary cards display:
- **Total Goals:** Count of active goals
- **Total Target:** Sum of all target amounts
- **Total Saved:** Sum of all current amounts
- **Overall Progress:** Weighted average progress percentage

### AC2: Individual Goal Cards with Progress

**And** individual goal cards show:
- Goal name and icon
- **Progress Bar:** Visual bar with percentage
- **Amount Display:** "$X,XXX / $Y,YYY"
- **Deadline Indicator:**
  - Green: > 3 months away
  - Yellow: 1-3 months away
  - Red: < 1 month away
  - Gray: No deadline
- **Quick Actions:** Add Money, Edit, Delete buttons

### AC3: Timeline Chart for Multiple Goals

**And** timeline chart displays:
- X-axis: Months (current month to furthest deadline)
- Y-axis: Dollar amounts
- Bars/lines for each goal showing projected completion
- Current progress vs target

### AC4: Projected Completion Dates

**And** projected completion dates calculated based on:
- Current savings rate (average monthly allocation)
- Remaining amount needed
- Display: "At current rate: X months"

### AC5: Responsive Layout

**And** responsive design:
- Desktop: Grid layout with 2-3 goal cards per row
- Tablet: 2 per row
- Mobile: 1 per row, stacked

---

## Prerequisites

- Story 9.3 (progress calculation)

---

## Technical Notes

- Use Recharts for timeline visualization
- Calculate savings rate from allocation history
- Weighted progress: (sum of current amounts) / (sum of target amounts) * 100
- Deadline color coding based on days remaining
- Empty state when no goals exist
- Loading skeleton during data fetch

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Overview summary cards displayed
- [ ] Goal cards with progress bars
- [ ] Timeline chart rendered
- [ ] Projected completion dates shown
- [ ] Deadline color coding working
- [ ] Responsive layout functional
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
