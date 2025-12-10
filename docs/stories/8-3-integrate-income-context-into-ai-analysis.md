# Story 8.3: Integrate Income Context into AI Analysis

**Epic:** Epic 8 - Income Profile & AI Budget Recommendations
**Story ID:** 8.3
**Status:** done
**Created:** 2025-11-25
**Completed:** 2025-11-30
**Sprint:** Phase 2, Epic 8

---

## User Story

**As a** user with income information configured,
**I want** AI analysis to include income-based recommendations,
**So that** I get personalized budget advice based on my earnings.

---

## Acceptance Criteria

### AC1: Income Data Included in AI Prompt

**Given** I have configured my income profile
**When** I request AI analysis
**Then** the analysis includes income-based insights

**And** AI prompt enhancement:
```
User Income Profile:
- Expected Monthly Income: $X,XXX
- Primary Source: [source]
- Additional Income: $XXX

Actual Income (from transactions): $X,XXX

Analyze:
1. Is user living within their means?
2. Recommended savings rate (suggest 20% of income)
3. Budget allocation (50/30/20 rule)
4. Income shortfall or surplus
5. Emergency fund target (3-6 months expenses)
```

### AC2: Income-Based Insights Generated

**And** new insights include:
- "Your expenses are 85% of income - good ratio!"
- "You spent $500 more than you earned this month"
- "Recommended emergency fund: $15,000 (6 months)"
- "Try saving $800/month (20% of income)"
- "Budget allocation: $2,500 needs, $1,500 wants, $1,000 savings"

### AC3: Comparison of Expected vs Actual Income

**And** analysis compares expected income (from profile) with actual income (from transactions)

### AC4: Graceful Handling When Income Not Configured

**And** when income profile not configured, analysis still works but doesn't include income-based recommendations

---

## Prerequisites

- Story 8.1 (income API)
- Story 7.2 (AI analysis)

---

## Technical Notes

- Fetch income profile when building AI context
- Calculate 50/30/20 rule: 50% needs, 30% wants, 20% savings
- Emergency fund: 3-6 months of average expenses
- Savings rate: (income - expenses) / income * 100
- Include income data in both GPT and Gemini prompts
- Handle case where income exists but no income transactions logged

---

## Definition of Done

- [x] All acceptance criteria pass
- [x] Income data fetched for AI analysis
- [x] AI prompt includes income context
- [x] Income-based insights generated
- [x] 50/30/20 rule recommendations
- [x] Emergency fund calculation
- [x] Graceful handling when no income
- [x] Manual tests pass
- [x] Code reviewed
- [x] Story marked 'done' in sprint-status.yaml
