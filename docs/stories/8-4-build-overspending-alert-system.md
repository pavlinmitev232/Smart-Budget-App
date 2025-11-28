# Story 8.4: Build Overspending Alert System

**Epic:** Epic 8 - Income Profile & AI Budget Recommendations
**Story ID:** 8.4
**Status:** drafted
**Created:** 2025-11-25
**Sprint:** Phase 2, Epic 8

---

## User Story

**As a** user,
**I want to** receive alerts when I'm overspending relative to my income,
**So that** I can take corrective action before running out of money.

---

## Acceptance Criteria

### AC1: Alert Triggers Defined

**Given** I have income profile configured
**When** my expenses exceed thresholds
**Then** I receive overspending alerts

**And** alert triggers:
- Monthly expenses > 90% of monthly income
- Monthly expenses > 100% of income
- Negative net balance for 2+ consecutive months

### AC2: Alert Delivery Methods

**And** alert delivery:
- Real-time toast notification (when logged in)
- Dashboard banner (dismissible)
- Email notification (opt-in setting)
- SMS notification (Pro tier, future enhancement)

### AC3: Alert Content with AI Recommendation

**And** alert content:
```
⚠️ Overspending Alert

You've spent $4,500 of your $5,000 monthly income (90%).

AI Recommendation: Reduce "Dining Out" by $300/month to stay on track.

[View Details] [Dismiss]
```

### AC4: User Alerts Table

**And** alerts stored in `user_alerts` table:
```sql
CREATE TABLE user_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  alert_type VARCHAR(50),
  severity VARCHAR(20),
  message TEXT,
  ai_suggestion TEXT,
  is_read BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### AC5: Background Job Checks Daily

**And** background job checks overspending daily and creates alerts

### AC6: Dashboard Banner Display

**And** dashboard banner shows unread alerts with dismiss action

---

## Prerequisites

- Story 8.1 (income profile)
- Story 7.2 (AI service for suggestions)

---

## Technical Notes

- Background job runs daily at midnight
- Alert only if income profile exists
- Calculate current month expenses vs income
- Use AI to generate specific savings suggestion
- Email opt-in: Add to user preferences table
- Mark alert as read when viewed
- Dismiss action soft-deletes (dismissed_at timestamp)
- Future: Add alert preferences (thresholds, delivery methods)

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] user_alerts table created
- [ ] Background job implemented
- [ ] Alert triggers working correctly
- [ ] Toast notifications functional
- [ ] Dashboard banner displays alerts
- [ ] AI-generated suggestions included
- [ ] Email delivery (opt-in)
- [ ] Dismiss action working
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Code reviewed
- [ ] Story marked 'done' in sprint-status.yaml
