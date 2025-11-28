# Story 7.5: Add Request Tracking and Tier-Based Routing

**Epic:** Epic 7 - AI Financial Advisor (GPT-5.1 Primary)
**Story ID:** 7.5
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 7

---

## User Story

**As a** system administrator,
**I want to** track all AI requests and route based on subscription tier,
**So that** quota limits are enforced and costs are managed.

---

## Acceptance Criteria

### AC1: Quota Checking Before Analysis

**Given** a user requests AI analysis or chat
**When** the request is made
**Then** quota is checked before processing

### AC2: Tier-Based Provider Routing

**And** routing logic:
- Free tier → Gemini 3.0 Pro
- Basic tier → GPT-5.1
- Pro tier → GPT-5.1

### AC3: Request Logging After Completion

**And** all requests logged to `user_requests` table with:
- user_id
- request_type ('ai_insight' or 'ai_chat')
- provider ('gpt-5.1' or 'gemini-3-pro')
- tokens_used
- timestamp

### AC4: Quota Warning at 80%

**And** quota warning shown at 80% usage (e.g., "4/5 insights used")

### AC5: Quota Exceeded Modal

**And** quota exceeded modal displays:
```
Daily Limit Reached

You've used all 5 AI insights for today.

Upgrade to Basic for 50/day or Pro for unlimited insights.

[View Plans] [Cancel]
```

### AC6: Error Handling and Fallback

**And** error handling:
- Quota exceeded: Show upgrade prompt
- AI provider error: Fallback to other provider
- Timeout (>60s): Show error, offer retry
- Invalid response: Log and show generic error

---

## Prerequisites

- Story 7.2 (analysis endpoint)
- Story 10.2 (quota service)
- Story 10.3 (feature gating middleware)

---

## Technical Notes

- Use middleware from Epic 10.3
- Implement provider fallback chain: GPT → Gemini → Error
- Monitor and alert on high error rates
- Track cost per user for optimization
- Log all AI requests for analytics
- Admin dashboard: View AI usage stats (future)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Quota checking integrated
- [ ] Tier-based routing working
- [ ] Request logging functional
- [ ] Quota warning displayed
- [ ] Quota exceeded modal shown
- [ ] Error handling and fallback working
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
