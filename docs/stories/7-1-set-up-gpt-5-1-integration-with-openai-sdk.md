# Story 7.1: Set Up GPT-5.1 Integration with OpenAI SDK

**Epic:** Epic 7 - AI Financial Advisor (GPT-5.1 Primary)
**Story ID:** 7.1
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 7

---

## User Story

**As a** developer,
**I want to** integrate GPT-5.1 via the OpenAI SDK,
**So that** the app can leverage AI for financial analysis.

---

## Acceptance Criteria

### AC1: OpenAI and Gemini SDKs Installed

**Given** the backend needs AI capabilities
**When** I configure the AI service
**Then** GPT-5.1 and Gemini are integrated with fallback logic

**And** SDKs installed:
```bash
npm install openai @google/generative-ai
```

### AC2: Environment Variables Configured

**And** environment variables:
```bash
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIza...
```

### AC3: AIService Class with Connection Tests

**And** AIService class created with:
- `testGPTConnection()` method
- `testGeminiConnection()` method
- `healthCheck()` method returning status of both providers

### AC4: Health Check Endpoint

**And** health check endpoint exists:
```typescript
GET /api/ai/health
Response: { "success": true, "data": { "gpt": true, "gemini": true, "status": "All AI providers operational" } }
```

### AC5: Error Handling for Missing API Keys

**And** error handling throws if API keys not configured

### AC6: Singleton Pattern for Service

**And** AI service is singleton (reuse connections)

---

## Prerequisites

- Story 1.4 (environment config)
- Story 10.1 (subscription tiers)

---

## Technical Notes

- Store API keys in .env (never commit)
- Test connection on server startup
- Log AI provider status
- Monitor API usage and costs
- Consider using OpenAI organization ID for better tracking
- Set reasonable timeouts (30s) to prevent hanging requests
- Implement retry logic with exponential backoff
- Future: Add API key rotation mechanism

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] OpenAI SDK integrated
- [ ] Gemini SDK integrated
- [ ] AIService class created
- [ ] Health check endpoint working
- [ ] Connection tests passing
- [ ] Error handling for missing keys
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
