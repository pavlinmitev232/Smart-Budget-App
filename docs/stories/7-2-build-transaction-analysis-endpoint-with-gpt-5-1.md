# Story 7.2: Build Transaction Analysis Endpoint with GPT-5.1

**Epic:** Epic 7 - AI Financial Advisor (GPT-5.1 Primary)
**Story ID:** 7.2
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 7

---

## User Story

**As a** user,
**I want to** get comprehensive AI-powered insights about my spending patterns,
**So that** I can make better financial decisions based on expert analysis.

---

## Acceptance Criteria

### AC1: Transaction Analysis Endpoint

**Given** I am authenticated and have transaction data
**When** I request AI analysis of my transactions
**Then** GPT-5.1 analyzes my data and provides actionable insights

**And** the endpoint `/api/ai/analyze` accepts:
```json
{
  "timeRange": "30days" | "3months" | "6months" | "custom",
  "startDate": "2025-10-01",
  "endDate": "2025-11-25",
  "includeIncome": true
}
```

### AC2: Tier-Based Provider Routing

**And** routing logic: Free tier → Gemini, Basic/Pro → GPT-5.1

### AC3: Comprehensive Analysis Prompt

**And** analysis prompt includes:
1. Spending Overview (total, net balance, savings rate, trends)
2. Category Breakdown (top 5, unusual patterns)
3. Anomaly Detection (outliers, suspicious transactions)
4. Savings Opportunities (specific recommendations)
5. Budget Recommendations (spending limits by category)
6. Personalized Insights (user-specific observations)

### AC4: GPT-5.1 Implementation

**And** GPT-5.1 analysis uses:
- Model: `gpt-5.1-chat-latest` (adaptive reasoning)
- Temperature: 0.7
- Max tokens: 2000
- Prompt caching enabled (`store: true`)
- Metadata tracking (user_id, feature)

### AC5: Gemini Fallback Implementation

**And** Gemini fallback for free tier uses `gemini-3-pro` with `thinking_level: 'low'` for cost optimization

### AC6: Successful Response Format

**And** successful response:
```json
{
  "success": true,
  "data": {
    "insights": "# SPENDING OVERVIEW\n\n...",
    "provider": "gpt-5.1",
    "tokensUsed": 1250,
    "cached": false,
    "generatedAt": "2025-11-25T10:30:00Z"
  },
  "quotaStatus": {
    "remaining": 4,
    "limit": 5,
    "resetAt": "2025-11-26T10:30:00Z"
  }
}
```

### AC7: Request Logging

**And** request is logged after successful generation using QuotaService

---

## Prerequisites

- Story 7.1 (AI integration)
- Story 10.2 (quota tracking)
- Story 3.3 (transactions API)

---

## Technical Notes

- Use transaction date range to avoid analyzing too much data
- Limit to 1000 most recent transactions for performance
- Cache system prompt (doesn't change per user)
- Include income data from Epic 8 if available
- Calculate savings rate: (income - expenses) / income * 100
- Use markdown formatting for better readability
- Test with various transaction volumes
- Monitor token usage to optimize costs
- Consider streaming responses for better UX (future)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Analysis endpoint implemented
- [ ] GPT-5.1 integration working
- [ ] Gemini fallback working
- [ ] Tier-based routing correct
- [ ] Comprehensive analysis generated
- [ ] Request logging functional
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
