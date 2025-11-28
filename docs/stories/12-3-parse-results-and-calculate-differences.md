# Story 12.3: Parse Results and Calculate Differences

**Epic:** Epic 12 - AI Bill Comparison Tool
**Story ID:** 12.3
**Status:** drafted
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

- [ ] All acceptance criteria pass
- [ ] GPT response parsed correctly
- [ ] All metrics calculated accurately
- [ ] Items categorized by change
- [ ] Summary insights generated
- [ ] Validation checks in place
- [ ] Edge cases handled
- [ ] Unit tests pass (calculation logic)
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
