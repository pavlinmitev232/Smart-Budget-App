# Story 7.4: Implement AI Chat Interface

**Epic:** Epic 7 - AI Financial Advisor (GPT-5.1 Primary)
**Story ID:** 7.4
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 7

---

## User Story

**As a** user,
**I want to** ask financial questions in a chat interface,
**So that** I can get personalized answers with context from my transactions.

---

## Acceptance Criteria

### AC1: Chat Interface in Insights Modal

**Given** I have opened the AI Insights modal
**When** I click the "Chat" tab
**Then** I see an interactive chat interface

### AC2: Chat Features

**And** chat interface includes:
- Message history (session-based, not persisted)
- Text input field with character counter (500 char max)
- Send button
- Auto-scroll to newest message
- Quick prompts: "How can I save more?", "What's my biggest expense?", "Am I overspending?"
- Deep thinking toggle for complex questions
- Clear conversation button

### AC3: Context Awareness

**And** messages automatically include recent transaction summary as context

### AC4: Chat API Endpoint

**And** endpoint `/api/ai/chat` accepts:
```json
{
  "message": "How can I reduce my grocery spending?",
  "conversationHistory": [...],
  "deepThinking": false
}
```

### AC5: Response Streaming

**And** responses use GPT-5.1 instant mode (2-5 seconds) with message streaming (words appear as generated)

### AC6: Conversation Management

**And** conversation limits:
- Max 10 messages per conversation
- Each message counts as 1 AI request (quota check)
- Clear conversation resets history

---

## Prerequisites

- Story 7.2 (AI service)
- Story 7.3 (modal UI)

---

## Technical Notes

- Store conversation in component state (not persisted)
- Use SSE or WebSockets for streaming responses
- Auto-scroll to newest message
- Character limit: 500 chars per message
- Max 10 messages per conversation
- Deep thinking toggle switches between gpt-5.1-chat-latest (fast) and gpt-5.1 (deep)
- Include transaction summary in system prompt for context

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Chat tab in modal
- [ ] Message input and display
- [ ] Quick prompts working
- [ ] Streaming responses functional
- [ ] Context awareness implemented
- [ ] Conversation limits enforced
- [ ] Deep thinking toggle working
- [ ] Unit tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
