# Story 12.2: Build Bill Comparison with GPT-5.1 Vision

**Epic:** Epic 12 - AI Bill Comparison Tool
**Story ID:** 12.2
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 12

---

## User Story

**As a** user,
**I want** AI to analyze and compare two bills/receipts,
**So that** I can see price changes and identify savings opportunities.

---

## Acceptance Criteria

### AC1: Bill Comparison Endpoint

**Given** I have uploaded two bill images
**When** I submit them for comparison
**Then** GPT-5.1 Vision analyzes both images and returns comparison data

**And** endpoint `/api/bills/compare` accepts:
```json
{
  "billImage1": "base64_string_or_image_id",
  "billImage2": "base64_string_or_image_id",
  "comparisonNotes": "Comparing grocery bills from Nov vs Oct"
}
```

### AC2: GPT-5.1 Vision Analysis

**And** GPT-5.1 Vision performs:
1. **OCR Extraction:** Extract text from both images
2. **Item Identification:** Identify individual items and prices
3. **Item Matching:** Match similar items between bills
4. **Price Comparison:** Calculate price differences per item
5. **Summary Generation:** Overall comparison insights

### AC3: Prompt Engineering for Bill Analysis

**And** analysis prompt:
```
You are analyzing two receipts/bills to compare prices.

Image 1: [First bill image]
Image 2: [Second bill image]

Tasks:
1. Extract all items and prices from both bills
2. Match identical or similar items between bills
3. Calculate price differences
4. Identify items only in one bill
5. Calculate total difference
6. Provide insights on price changes

Return JSON:
{
  "bill1": { "total": X, "date": "...", "vendor": "...", "items": [...] },
  "bill2": { "total": Y, "date": "...", "vendor": "...", "items": [...] },
  "matched_items": [
    { "item": "Milk", "price1": 3.99, "price2": 4.29, "difference": 0.30, "percent_change": 7.5 }
  ],
  "unmatched_bill1": [...],
  "unmatched_bill2": [...],
  "total_difference": Z,
  "insights": "..."
}
```

### AC4: Response Format

**And** successful response:
```json
{
  "success": true,
  "data": {
    "comparison": { ... },
    "provider": "gpt-5.1-vision",
    "tokensUsed": 2500,
    "generatedAt": "2025-11-25T10:30:00Z"
  },
  "quotaStatus": {
    "remaining": 0,
    "limit": 1,
    "resetAt": "2025-11-26T10:30:00Z"
  }
}
```

### AC5: Store Comparison Results

**And** comparisons stored in database:
```sql
CREATE TABLE bill_comparisons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  bill1_id INTEGER REFERENCES bill_images(id),
  bill2_id INTEGER REFERENCES bill_images(id),
  comparison_result JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Prerequisites

- Story 12.1 (image upload)
- Story 7.1 (GPT integration)
- Story 10.2 (quota tracking)

---

## Technical Notes

- Use GPT-5.1 Vision model: `gpt-5.1-vision`
- Send images as base64 or URLs
- Parse JSON response from GPT
- Handle OCR errors gracefully
- Fallback: If matching fails, show items side-by-side
- Log request with provider and tokens used
- Consider caching comparisons (same bills)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Comparison endpoint functional
- [ ] GPT-5.1 Vision integration working
- [ ] JSON parsing successful
- [ ] Comparisons stored in database
- [ ] Quota tracking integrated
- [ ] Error handling robust
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
