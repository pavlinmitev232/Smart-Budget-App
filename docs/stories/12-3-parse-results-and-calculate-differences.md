# Story 12.3: Parse Results and Calculate Differences

**Epic:** Epic 12 - AI Bill Comparison Tool
**Story ID:** 12.3
**Status:** done
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 12

---

## User Story

**As a** user,
**I want** the comparison results parsed into clear metrics,
**So that** I can quickly understand price changes.

---

## Acceptance Criteria

### AC1: Parse GPT Vision Response

**Given** GPT-5.1 Vision returns comparison JSON
**When** the backend processes the response
**Then** the data is parsed and validated

**And** parsing extracts:
- Bill 1 items and total
- Bill 2 items and total
- Matched items with price differences
- Unmatched items from both bills
- Overall total difference

### AC2: Calculate Comparison Metrics

**And** calculations performed:

**Total Difference:**
```typescript
total_difference = bill2.total - bill1.total
percent_change = (total_difference / bill1.total) * 100
```

**Per-Item Differences:**
```typescript
for each matched_item:
  difference = item.price2 - item.price1
  percent_change = (difference / item.price1) * 100
```

**Average Inflation Rate:**
```typescript
avg_inflation = average of all matched item percent_changes
```

**Biggest Changes:**
- Largest price increase (item and amount)
- Largest price decrease (item and amount)

### AC3: Categorize Changes

**And** items categorized by change:
- **Increased Prices:** Items that got more expensive
- **Decreased Prices:** Items that got cheaper
- **Unchanged:** Items with same price (±$0.05 tolerance)

### AC4: Generate Summary Insights

**And** summary insights:
- "Your total increased by $12.50 (8%)"
- "5 items got more expensive, 2 got cheaper"
- "Average inflation rate: 6%"
- "Biggest increase: Eggs (+$1.50, +50%)"
- "Best deal: Bananas (-$0.30, -15%)"

### AC5: Data Validation

**And** validation checks:
- All price values are numbers
- Percentages calculated correctly
- Handle missing or null values
- Fallback for failed item matching

---

## Prerequisites

- Story 12.2 (GPT Vision comparison)

---

## Technical Notes

- Validate JSON structure from GPT response
- Handle edge cases: No matches, OCR errors, invalid prices
- Use precise decimal math (avoid floating point errors)
- Round percentages to 1 decimal place
- Round currency to 2 decimal places
- Consider inflation threshold (changes < 5% might be normal)
- Store parsed results in comparison_result JSONB

---

## Definition of Done

- [x] All acceptance criteria pass
- [x] GPT response parsed correctly
- [x] All metrics calculated accurately
- [x] Items categorized by change
- [x] Summary insights generated
- [x] Validation checks in place
- [x] Edge cases handled
- [x] Unit tests pass (calculation logic)
- [x] Code reviewed
- [x] Story marked 'done' in sprint-status.yaml

---

## Dev Agent Record

### Files Modified/Created
- `backend/src/features/bill-comparison/bill-comparison.types.ts` - Added ComparisonMetrics, CategorizedItems, SummaryInsights interfaces
- `backend/src/features/bill-comparison/bill-comparison.utils.ts` - NEW - Utility functions for parsing and calculations
- `backend/src/features/bill-comparison/bill-comparison.service.ts` - Updated runAIAnalysis to use new processing logic

### Completion Notes
Implemented comprehensive parsing and calculation logic for Story 12.3:
- Created `processAIResponse()` to validate and sanitize AI response data
- Added precise decimal math with `roundTo()` utility to avoid floating point errors
- Implemented `categorizeItems()` with ±$0.05 tolerance for unchanged items
- Added `calculateMetrics()` for average inflation rate and biggest changes detection
- Created `generateSummaryInsights()` for human-readable summary messages
- All validation checks handle missing/null values with safe defaults
