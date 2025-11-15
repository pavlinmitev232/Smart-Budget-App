# Story 3.2: Implement Create Transaction API Endpoint

Status: done

## Story

As a user,
I want to create new income or expense transactions via API,
So that I can record my financial activities.

## Acceptance Criteria

**AC1:** Given I am authenticated, when I POST to `/api/transactions` with transaction data, then a new transaction is created and associated with my user account

**AC2:** The request body includes:
```json
{
  "type": "income" | "expense",
  "amount": 150.50,
  "category": "Food & Dining",
  "date": "2025-11-12",
  "description": "Grocery shopping",
  "sourceVendor": "Whole Foods"
}
```

**AC3:** The API validates:
- User is authenticated (req.user.userId exists)
- `type` is either "income" or "expense" (required)
- `amount` is a positive decimal with max 2 decimal places (required)
- `category` exists in predefined list and matches type (required)
- `date` is valid date in YYYY-MM-DD format (required)
- `description` is optional text
- `sourceVendor` is optional text

**AC4:** Successful creation returns 201 with:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": 1,
      "userId": 1,
      "type": "expense",
      "amount": "150.50",
      "category": "Food & Dining",
      "date": "2025-11-12",
      "description": "Grocery shopping",
      "sourceVendor": "Whole Foods",
      "createdAt": "2025-11-12T10:30:00Z",
      "updatedAt": "2025-11-12T10:30:00Z"
    }
  }
}
```

**AC5:** Validation errors return 400 with specific error messages

**AC6:** Amount is stored as DECIMAL(10,2) for precision

## Tasks / Subtasks

- [x] **Task 1: Add Transaction Model to Prisma Schema** (AC: #1, #6)
  - [x] Define Transaction model (already exists from Story 1.3)
  - [x] Fields: id, userId, type, amount (Decimal), category, date, description, sourceVendor
  - [x] Add foreign key to User model (CASCADE delete)
  - [x] Add indexes on userId+date, userId+category
  - [x] Migration already applied (using node-pg-migrate, not Prisma)

- [x] **Task 2: Create Transaction Types** (AC: #2, #4)
  - [x] Create `backend/src/features/transactions/transactions.types.ts`
  - [x] Define CreateTransactionDto type
  - [x] Define Transaction type (matches database schema)
  - [x] Define TransactionResponse type
  - [x] Export all types

- [x] **Task 3: Create Transaction Validation** (AC: #3)
  - [x] Create validation middleware (transactions.validation.ts)
  - [x] Validate type is 'income' or 'expense'
  - [x] Validate amount is positive decimal with max 2 decimals
  - [x] Validate category exists in CATEGORIES list
  - [x] Validate category matches transaction type
  - [x] Validate date format YYYY-MM-DD
  - [x] Return 400 with detailed error messages

- [x] **Task 4: Create Transaction Service** (AC: #1, #3)
  - [x] Create `backend/src/features/transactions/transactions.service.ts`
  - [x] Implement `createTransaction(userId, data)` function
  - [x] Use pg pool to insert transaction (not Prisma)
  - [x] Set userId from authenticated user (req.user)
  - [x] Return created transaction with all fields

- [x] **Task 5: Create Transaction Controller** (AC: #1, #4, #5)
  - [x] Create `backend/src/features/transactions/transactions.controller.ts`
  - [x] Implement `createTransaction` controller
  - [x] Extract userId from req.user (from authMiddleware)
  - [x] Call service layer
  - [x] Return 201 status with standardized response
  - [x] Handle errors and return 400 for validation failures

- [x] **Task 6: Create Transaction Routes** (AC: #1)
  - [x] Create `backend/src/features/transactions/transactions.routes.ts`
  - [x] Define POST /api/transactions route
  - [x] Apply authMiddleware (protected endpoint)
  - [x] Apply validation middleware
  - [x] Map to controller function
  - [x] Export router

- [x] **Task 7: Register Routes in Main App** (AC: #1)
  - [x] Import transactions router in `backend/src/index.ts`
  - [x] Register with app: `app.use('/api/transactions', transactionsRouter)`
  - [x] Test route registration

- [x] **Task 8: Test Create Transaction Endpoint** (AC: #1-6)
  - [x] Test POST without auth token (expect 401) ✓
  - [x] Test POST with valid data (expect 201) ✓
  - [x] Test invalid type (expect 400) ✓
  - [x] Test negative amount (expect 400) ✓
  - [x] Test invalid category (expect 400) ✓
  - [x] Test category mismatch with type (expect 400) ✓
  - [x] Test invalid date format (expect 400) ✓
  - [x] Verify transaction stored in database ✓
  - [x] Verify amount stored with 2 decimal precision ✓

## Dev Notes

### Architecture Alignment

**Backend Architecture:**
- Feature-based structure: `backend/src/features/transactions/`
- Prisma ORM for database operations
- JWT authentication via authMiddleware
- Standard response format
- TypeScript for type safety

**Database Schema (Prisma):**
```prisma
model Transaction {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  type          String   // 'income' or 'expense'
  amount        Decimal  @db.Decimal(10, 2)
  category      String
  date          DateTime
  description   String?
  sourceVendor  String?  @map("source_vendor")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@index([userId, category])
  @@map("transactions")
}
```

### Learnings from Previous Story

**From Story 3.1: Implement Categories API (Status: drafted, previous in sequence)**

- **Categories Available:**
  - GET /api/categories endpoint created
  - Returns income and expense categories
  - Categories defined in `backend/src/features/categories/categories.constants.ts`
  - Use CATEGORIES constant to validate category field

- **Recommendations:**
  - Import CATEGORIES from categories.constants.ts
  - Validate category exists in appropriate type array
  - Frontend will fetch categories for dropdown (Story 3.5)

[Source: stories/3-1-implement-categories-api-with-predefined-list.md]

**From Story 2.6: Protected Routes (Status: done)**

- Auth middleware available at `backend/src/middleware/auth.ts`
- Use authMiddleware to protect this endpoint
- req.user contains { userId, email } from JWT

### Project Structure Notes

**New Files:**
```
backend/
├── src/
│   └── features/
│       └── transactions/
│           ├── transactions.service.ts
│           ├── transactions.controller.ts
│           ├── transactions.routes.ts
│           └── transactions.types.ts
└── prisma/
    └── migrations/
        └── [timestamp]_add_transactions/
```

**Modified Files:**
```
backend/
├── src/
│   └── server.ts
└── prisma/
    └── schema.prisma
```

### Technical Constraints

**Prerequisites:**
- Story 1.3 (database schema planning)
- Story 2.3 (auth middleware exists)
- Story 3.1 (categories API exists)

**Validation Rules:**
- type: Must be "income" or "expense"
- amount: Positive number, max 2 decimals
- category: Must exist in CATEGORIES[type] array
- date: Valid date string YYYY-MM-DD, can be past or present
- description: Optional, max length TBD
- sourceVendor: Optional, max length TBD

**Implementation Pattern:**
```typescript
// transactions.service.ts
export const transactionsService = {
  createTransaction: async (userId: number, data: CreateTransactionDto) => {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: data.type,
        amount: new Decimal(data.amount),
        category: data.category,
        date: new Date(data.date),
        description: data.description,
        sourceVendor: data.sourceVendor
      }
    });
    return transaction;
  }
};
```

### Testing Standards

- Protected endpoint requires valid JWT
- All validation rules enforced
- Returns 201 for successful creation
- Returns 400 for validation failures
- Transaction visible in database
- Amount precision preserved (2 decimals)
- userId automatically set from JWT (never from request body)

### References

- [Source: docs/epics.md#Story-3.2-Implement-Create-Transaction-API]
- [Source: docs/PRD.md#Transaction-Management]
- [Source: docs/architecture.md#Prisma-Schema]
- [Source: docs/architecture.md#API-Contracts]
- [Source: stories/3-1-implement-categories-api-with-predefined-list.md]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References

**Implementation Notes (2025-11-15):**
- Discovered project uses node-pg-migrate + pg library (NOT Prisma as story suggested)
- Transaction table already exists from Story 1.3 with correct schema
- Adapted implementation to use pg pool instead of Prisma ORM
- Created comprehensive validation middleware with category integration
- All validation rules enforced at API level before database insert

### Completion Notes List

**Implementation Summary (2025-11-15):**
- ✅ All 8 tasks completed (47 subtasks)
- ✅ All 6 acceptance criteria validated through comprehensive testing
- ✅ Protected endpoint with JWT authentication
- ✅ Comprehensive input validation (type, amount, category, date)
- ✅ Category validation integrated with Story 3.1 categories
- ✅ Standard response format (201 for success, 400 for validation errors)
- ✅ Database schema already in place from Story 1.3
- ✅ Amount precision preserved (DECIMAL(10,2))

**Test Results:**
- POST without auth: 401 ✓
- POST with valid data: 201 with transaction ✓
- Invalid type: 400 with error ✓
- Negative amount: 400 with error ✓
- Invalid category: 400 with error ✓
- Category type mismatch: 400 with error ✓
- Invalid date format: 400 with error ✓
- Amount >2 decimals: 400 with error ✓
- 2 test transactions created in database ✓

### File List

**New Files:**
- `backend/src/features/transactions/transactions.types.ts` - TypeScript type definitions
- `backend/src/features/transactions/transactions.validation.ts` - Input validation middleware
- `backend/src/features/transactions/transactions.service.ts` - Database service layer
- `backend/src/features/transactions/transactions.controller.ts` - Request handlers
- `backend/src/features/transactions/transactions.routes.ts` - Protected route definitions

**Modified Files:**
- `backend/src/index.ts` - Registered transactions router

## Change Log

- 2025-11-14: Story drafted by SM agent (Bob) from epics.md, architecture.md, and PRD.md
- 2025-11-15: Story implemented and tested by Dev agent (Amelia) - All tasks complete, all ACs met
