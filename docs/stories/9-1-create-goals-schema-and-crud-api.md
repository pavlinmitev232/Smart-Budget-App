# Story 9.1: Create Goals Schema and CRUD API

**Epic:** Epic 9 - Financial Goal Tracking
**Story ID:** 9.1
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 9

---

## User Story

**As a** user,
**I want to** create and manage savings goals,
**So that** I can track my progress toward financial objectives.

---

## Acceptance Criteria

### AC1: Goals Table Created

**Given** the database needs to store user goals
**When** the migration is run
**Then** the `goals` table is created

**And** schema:
```sql
CREATE TABLE goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  goal_type VARCHAR(50) CHECK (type IN ('savings', 'purchase', 'debt_payoff')),
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
```

### AC2: CRUD API Endpoints

**And** API endpoints exist:
- `GET /api/goals` - List user goals (with filters: status, priority)
- `GET /api/goals/:id` - Get single goal
- `POST /api/goals` - Create new goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/allocate` - Add money to goal

### AC3: Tier-Based Goal Limits

**And** tier limits enforced:
- Free: Max 3 active goals
- Basic: Max 10 active goals
- Pro: Unlimited active goals

### AC4: Validation Rules

**And** validation:
- name: Required, 1-200 chars
- target_amount: > 0
- current_amount: >= 0, <= target_amount
- deadline: Optional, future date
- Enforce tier limits on create

### AC5: Progress Calculation

**And** progress calculated:
```typescript
progress_percentage = (current_amount / target_amount) * 100
is_completed = current_amount >= target_amount
```

---

## Prerequisites

- Story 10.1 (subscription tiers)

---

## Technical Notes

- Use middleware from Epic 10.3 for tier limits
- Soft delete (status = 'archived') instead of hard delete
- Auto-complete goal when current_amount >= target_amount
- Include progress calculation in API responses
- Sort by priority and deadline by default

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Migration creates goals table
- [ ] CRUD endpoints functional
- [ ] Tier limits enforced
- [ ] Validation working
- [ ] Progress calculation correct
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
