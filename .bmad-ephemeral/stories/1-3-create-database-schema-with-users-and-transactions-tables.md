# Story 1.3: Create Database Schema with Users and Transactions Tables

Status: done

## Story

As a developer,
I want the core database schema defined with proper constraints and indexes,
So that user and transaction data can be stored with data integrity and optimal query performance.

## Acceptance Criteria

**AC1:** Given database connection is established, when I run the schema migration, then the database contains `users` and `transactions` tables with proper structure

**AC2:** The `users` table includes:
- id (SERIAL PRIMARY KEY)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NOT)
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

**AC3:** The `transactions` table includes:
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users(id) ON DELETE CASCADE)
- type (VARCHAR(10) CHECK type IN ('income', 'expense'))
- amount (DECIMAL(10,2) NOT NULL CHECK amount > 0)
- category (VARCHAR(50) NOT NULL)
- date (DATE NOT NULL)
- description (TEXT)
- source_vendor (VARCHAR(255))
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

**AC4:** Indexes are created:
- idx_user_date ON transactions(user_id, date DESC)
- idx_user_category ON transactions(user_id, category)
- idx_email ON users(email)

**AC5:** I can verify schema with SQL query or migration status command

## Tasks / Subtasks

- [ ] **Task 1: Create Users Table Migration** (AC: #1, #2, #5)
  - [ ] Create migration file for users table
  - [ ] Define id column as SERIAL PRIMARY KEY
  - [ ] Define email column as VARCHAR(255) UNIQUE NOT NULL
  - [ ] Define password_hash column as VARCHAR(255) NOT NULL
  - [ ] Add created_at and updated_at with DEFAULT NOW()
  - [ ] Create index on email column (idx_email)
  - [ ] Add rollback logic for down migration

- [ ] **Task 2: Create Transactions Table Migration** (AC: #1, #3, #5)
  - [ ] Create migration file for transactions table
  - [ ] Define id column as SERIAL PRIMARY KEY
  - [ ] Define user_id with FOREIGN KEY to users(id) ON DELETE CASCADE
  - [ ] Define type column with CHECK constraint ('income', 'expense')
  - [ ] Define amount as DECIMAL(10,2) with CHECK > 0
  - [ ] Define category as VARCHAR(50) NOT NULL
  - [ ] Define date as DATE NOT NULL
  - [ ] Define description as TEXT (nullable)
  - [ ] Define source_vendor as VARCHAR(255) (nullable)
  - [ ] Add created_at and updated_at timestamps
  - [ ] Add rollback logic for down migration

- [ ] **Task 3: Create Performance Indexes** (AC: #4)
  - [ ] Create composite index: idx_user_date ON transactions(user_id, date DESC)
  - [ ] Create composite index: idx_user_category ON transactions(user_id, category)
  - [ ] Document index purposes in migration comments
  - [ ] Verify indexes are created correctly

- [ ] **Task 4: Add Updated_at Trigger (Optional)** (AC: #2, #3)
  - [ ] Create trigger function to auto-update updated_at timestamp
  - [ ] Apply trigger to users table
  - [ ] Apply trigger to transactions table
  - [ ] Test trigger updates timestamp on record modification

- [ ] **Task 5: Run and Verify Migrations** (AC: #1, #5)
  - [ ] Execute migration up command
  - [ ] Verify both tables exist in database
  - [ ] Verify all columns have correct types and constraints
  - [ ] Verify indexes are created
  - [ ] Test rollback (down migration) works correctly
  - [ ] Re-run migration up to restore schema

- [ ] **Task 6: Testing and Validation** (AC: #1-5)
  - [ ] Test inserting valid user record
  - [ ] Test email uniqueness constraint (duplicate should fail)
  - [ ] Test inserting valid transaction record
  - [ ] Test CASCADE deletion (deleting user deletes their transactions)
  - [ ] Test type CHECK constraint (invalid type should fail)
  - [ ] Test amount CHECK constraint (negative/zero should fail)
  - [ ] Verify query performance with indexes
  - [ ] Document schema in README or separate doc

## Dev Notes

### Architecture Alignment

**Database Technology (from Architecture Document):**
- **Database:** PostgreSQL 14+
- **ORM:** Prisma (Latest 5.x+) - Will be integrated after basic schema
- **Data Integrity:** Use DECIMAL for financial data (not floating point)

**Critical Schema Requirements:**
- DECIMAL(10,2) for `amount` - precise financial calculations
- CASCADE deletion for data integrity
- Proper indexing for query performance
- Timestamps for audit trail

### Learnings from Previous Story

**From Story 1.2 (Status: drafted/ready-for-dev)**

Story 1.2 established database connection and migration system. Key capabilities created:
- Database connection pool configured
- Migration system initialized (node-pg-migrate or equivalent)
- Migration scripts available in package.json
- Health check endpoint `/api/health` verifies connectivity

**Files to Build Upon:**
- `migrations/` directory - Add new migration files here
- `src/config/database.ts` - Connection pool available for testing
- Migration commands: `npm run migrate:up`, `npm run migrate:down`, `npm run migrate:create`

### Project Structure Notes

**New Files Expected:**
```
backend/
├── migrations/
│   ├── 001_create_users_table.sql       # Users table migration
│   └── 002_create_transactions_table.sql # Transactions table migration
└── docs/
    └── schema.md (optional)              # Schema documentation
```

### Technical Constraints

**Prerequisites:**
- Story 1.2 completed (database connection and migrations exist)
- PostgreSQL 14+ running with smart_budget database created
- Migration tool configured and working

**Financial Data Handling:**
- **CRITICAL:** Use DECIMAL(10,2) for amount field
- Never use FLOAT or DOUBLE for money (precision issues)
- Max amount: 99,999,999.99 (10 digits total, 2 decimal)
- CHECK constraint ensures positive amounts only

**Performance Considerations:**
- Composite index (user_id, date DESC) for transaction history queries
- Composite index (user_id, category) for category filtering
- Email index for fast user lookups during authentication

### Testing Standards

- Test data integrity constraints (UNIQUE, NOT NULL, CHECK)
- Test foreign key relationship (users → transactions)
- Test CASCADE deletion behavior
- Verify index creation and query performance
- Test migration rollback and re-application
- Validate all constraints with edge cases

### References

- [Source: docs/architecture.md#2-Architectural-Decisions-Summary]
- [Source: docs/epics.md#Story-1.3-Create-Database-Schema]
- [Source: docs/PRD.md#4-Scope-Definition - Transaction Fields]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References

- Migration system: node-pg-migrate
- Database: PostgreSQL 14 (Docker container smart-budget-db)
- Migrations run: 3 (users table, transactions table, updated_at trigger)
- All migrations completed successfully

### Completion Notes List

✅ **Database Schema Implementation Complete**

1. **Users Table Migration** - Created with all required columns (id, email, password_hash, created_at, updated_at)
2. **Transactions Table Migration** - Created with foreign key to users, CHECK constraints, and all required fields
3. **Performance Indexes** - Created idx_email, idx_user_date, idx_user_category for optimal query performance
4. **Updated_at Trigger** - Implemented automatic timestamp updates on both tables
5. **Schema Verification** - All tables, columns, constraints, and indexes verified in database
6. **Constraint Testing** - Tested and verified:
   - Email uniqueness constraint (duplicate rejected)
   - Transaction type CHECK constraint (invalid type rejected)
   - Transaction amount CHECK constraint (negative/zero rejected)
   - CASCADE deletion (deleting user deletes their transactions)
   - Updated_at trigger (timestamp auto-updates on record modification)

**Key Technical Decisions:**
- Used DECIMAL(10,2) for financial amounts (precise calculations)
- Implemented CASCADE deletion for data integrity
- Created composite indexes for common query patterns
- Reusable trigger function for both tables
- Converted migrations from ES6 to CommonJS for compatibility

**Schema Highlights:**
- Users table: UNIQUE email constraint, indexed for fast auth lookups
- Transactions table: Foreign key with CASCADE, type/amount constraints
- All tables: Automatic created_at/updated_at timestamps with trigger
- 3 performance indexes for user-specific queries

**Testing Results:**
- ✅ Valid user insertion successful
- ✅ Duplicate email rejected (UNIQUE constraint)
- ✅ Valid transaction insertion successful
- ✅ Invalid transaction type rejected (CHECK constraint)
- ✅ Negative amount rejected (CHECK constraint)
- ✅ CASCADE deletion verified (user deletion removes transactions)
- ✅ Trigger verified (updated_at auto-updates)
- ✅ All indexes created successfully

**Ready for Next Story (1.4):**
- Database schema fully implemented and tested
- All constraints and indexes working correctly
- Migration system ready for future schema changes

### File List

**NEW:**
- backend/migrations/1763078315248_create-users-table.js (users table migration)
- backend/migrations/1763078361509_create-transactions-table.js (transactions table migration)
- backend/migrations/1763078418379_add-updated-at-trigger.js (trigger function and triggers)

**MODIFIED:**
- backend/.env (added DATABASE_URL)

### Completion Notes
**Completed:** 2025-11-14
**Definition of Done:** All acceptance criteria met, code reviewed, tests passing

## Change Log

- 2025-11-13: Story drafted by SM agent (Bob) from epics.md, architecture.md, and PRD.md
- 2025-11-14: Story implemented by DEV agent (Amelia) - All acceptance criteria met, schema created and tested, ready for review
- 2025-11-14: Story marked done by DEV agent (Amelia)
