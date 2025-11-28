# Story 7.3: Create AI Insights Button and Modal UI

**Epic:** Epic 7 - AI Financial Advisor (GPT-5.1 Primary)
**Story ID:** 7.3
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 7

---

## User Story

**As a** user,
**I want to** click a button to view AI-generated financial insights,
**So that** I can understand my spending patterns and get recommendations.

---

## Acceptance Criteria

### AC1: Get AI Insights Button on Transactions Page

**Given** I am on the Transactions page
**When** I click "Get AI Insights" button
**Then** a modal opens with AI-generated analysis

### AC2: Modal Features

**And** the modal displays:
- Markdown-formatted insights with sections
- Time range selector (30 days, 3 months, 6 months, custom)
- "Refresh Analysis" button
- "Export to PDF" button (Pro tier only, disabled for Free/Basic)
- Quota status display (X/Y insights used today)
- Close button

### AC3: Loading State During Generation

**And** loading state during AI request (30-60 seconds):
- Skeleton loader animation
- Progress indicator
- Message: "Analyzing your transactions..."

### AC4: Insights Display with Sections

**And** insights rendered as markdown with sections:
- Overview
- Category Breakdown
- Anomalies
- Savings Tips
- Recommendations

### AC5: Local Storage Caching

**And** last analysis stored in local storage for quick re-view without new API call

### AC6: Quota Exceeded Handling

**And** quota exceeded errors show upgrade prompt modal

---

## Prerequisites

- Story 7.2 (analysis endpoint)
- Story 10.2 (quota tracking)

---

## Technical Notes

- Use React Modal or Chakra UI Modal
- Render markdown with `react-markdown`
- Skeleton loader during generation
- Handle quota exceeded errors gracefully
- Custom date range picker for "custom" option
- Export to PDF uses jsPDF library (Pro tier feature gate)
- Store last analysis: `{ insights, timestamp, timeRange }`
- Invalidate cache after 1 hour

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] AI Insights button added to Transactions page
- [ ] Modal component created
- [ ] Markdown rendering working
- [ ] Time range selector functional
- [ ] Loading state implemented
- [ ] Local storage caching working
- [ ] Quota status displayed
- [ ] Export to PDF (Pro only)
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
