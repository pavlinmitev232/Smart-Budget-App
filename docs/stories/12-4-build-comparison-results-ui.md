# Story 12.4: Build Comparison Results UI

**Epic:** Epic 12 - AI Bill Comparison Tool
**Story ID:** 12.4
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 12

---

## User Story

**As a** user,
**I want** to see a clear visual comparison of my bills,
**So that** I can easily spot price changes and trends.

---

## Acceptance Criteria

### AC1: Bill Comparison Page Layout

**Given** I have submitted two bills for comparison
**When** the analysis is complete
**Then** I see a comprehensive comparison results page

**And** page sections:
1. **Bill Summaries** (side-by-side)
2. **Total Comparison**
3. **Matched Items Table**
4. **Unmatched Items**
5. **AI Summary**

### AC2: Bill Summaries Section

**And** Bill Summaries displays (2 columns):

**Bill 1:**
- Vendor name (if detected)
- Date (if detected)
- Total amount: $XX.XX
- Item count: X items

**Bill 2:**
- Vendor name
- Date
- Total amount: $XX.XX
- Item count: X items

### AC3: Total Comparison Card

**And** Total Comparison card shows:
- **Total Difference:** ±$XX.XX (styled green for decrease, red for increase)
- **Percentage Change:** ±X%
- **Arrow Indicator:** ↑ or ↓
- **Message:** "You spent $12.50 more this time" or "You saved $5.00!"

### AC4: Matched Items Table

**And** Matched Items Table displays:

| Item | Bill 1 Price | Bill 2 Price | Difference | % Change |
|------|--------------|--------------|------------|----------|
| Milk | $3.99 | $4.29 | +$0.30 ↑ | +7.5% |
| Eggs | $4.50 | $3.99 | -$0.51 ↓ | -11.3% |

**And** table features:
- Sort by: Item name, Difference, % Change
- Color coding: Green (decrease), Red (increase), Gray (unchanged)
- Filter by: All, Increased, Decreased, Unchanged

### AC5: Unmatched Items Section

**And** Unmatched Items shows two lists:

**Only in Bill 1:**
- Bananas - $2.99

**Only in Bill 2:**
- Oranges - $3.49

### AC6: AI Summary Section

**And** AI Summary displays:
- Overall insights paragraph
- Key findings (bullet points):
  - Average inflation rate
  - Biggest price increase
  - Best deal (biggest decrease)
  - Recommendations

### AC7: Loading and Error States

**And** loading state shows:
- Skeleton loaders for each section
- Message: "Analyzing your bills with AI..."
- Progress indicator

**And** error state shows:
- Error message with icon
- Retry button
- Link to upload new images

---

## Prerequisites

- Story 12.3 (parsing and calculations)

---

## Technical Notes

- Use React Table or Tanstack Table for matched items
- Responsive layout: Side-by-side on desktop, stacked on mobile
- Color scheme: Green (#10b981), Red (#ef4444), Gray (#6b7280)
- Show bill images as thumbnails (click to enlarge)
- Export to PDF button (Pro tier only)
- Save comparison for future reference
- Loading state duration: ~30-60 seconds for GPT Vision

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Comparison results page created
- [ ] All sections rendered correctly
- [ ] Matched items table functional
- [ ] Color coding and styling correct
- [ ] Responsive layout working
- [ ] Loading state displayed
- [ ] Error handling functional
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
