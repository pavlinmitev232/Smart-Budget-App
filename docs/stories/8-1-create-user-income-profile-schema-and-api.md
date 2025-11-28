# Story 8.1: Create User Income Profile Schema and API

**Epic:** Epic 8 - Income Profile & AI Budget Recommendations
**Story ID:** 8.1
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 8

---

## User Story

**As a** user,
**I want to** input my income information,
**So that** AI can provide personalized budget recommendations based on my earnings.

---

## Acceptance Criteria

### AC1: User Income Profile Table Created

**Given** the database needs to store user income information
**When** the migration is run
**Then** the `user_income_profile` table is created

**And** schema:
```sql
CREATE TABLE user_income_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  primary_income_amount DECIMAL(10,2),
  primary_income_frequency VARCHAR(20) CHECK (frequency IN ('hourly', 'weekly', 'biweekly', 'monthly', 'annual')),
  primary_income_source VARCHAR(100),
  additional_monthly_income DECIMAL(10,2) DEFAULT 0,
  normalized_monthly_income DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AC2: API Endpoints Created

**And** API endpoints exist:
- `GET /api/user/income` - Get income profile
- `POST /api/user/income` - Create/update income profile
- `DELETE /api/user/income` - Remove income profile

### AC3: Income Normalization Logic

**And** normalization logic converts all frequencies to monthly:
- Hourly: amount × 40 hours × 4.33 weeks
- Weekly: amount × 4.33
- Biweekly: amount × 2.17
- Monthly: amount × 1
- Annual: amount ÷ 12

### AC4: API Response Format

**And** GET response:
```json
{
  "success": true,
  "data": {
    "primaryIncomeAmount": 5000,
    "primaryIncomeFrequency": "monthly",
    "primaryIncomeSource": "Acme Corp",
    "additionalMonthlyIncome": 500,
    "normalizedMonthlyIncome": 5500
  }
}
```

---

## Prerequisites

- Story 1.3 (users table)

---

## Technical Notes

- Normalized monthly income is auto-calculated on save
- One income profile per user (UNIQUE constraint on user_id)
- Validation: amount > 0, frequency in allowed list
- Privacy: Income data never exposed in logs or analytics
- Future: Support multiple income streams (separate table)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Migration creates table
- [ ] CRUD endpoints functional
- [ ] Normalization logic correct
- [ ] Validation enforced
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
