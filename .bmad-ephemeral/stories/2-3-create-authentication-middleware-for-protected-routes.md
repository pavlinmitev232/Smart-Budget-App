# Story 2.3: Create Authentication Middleware for Protected Routes

Status: done

## Story

As a developer,
I want JWT authentication middleware that protects API endpoints,
So that only authenticated users can access their own financial data.

## Acceptance Criteria

**AC1:** Given a protected API endpoint requires authentication, when a request includes a valid JWT token in the Authorization header, then the middleware extracts user information and attaches it to `req.user`

**AC2:** The middleware:
- Reads token from `Authorization: Bearer <token>` header
- Verifies token signature using JWT_SECRET
- Decodes token payload and attaches to `req.user = { userId, email }`
- Allows request to proceed to route handler

**AC3:** Requests without Authorization header return 401 with message "No token provided"

**AC4:** Requests with invalid/expired tokens return 401 with message "Invalid or expired token"

**AC5:** The middleware is reusable and can be applied to any route:
```javascript
router.get('/api/transactions', authMiddleware, getTransactions);
```

**AC6:** A test endpoint `/api/auth/me` returns current user info when authenticated

## Tasks / Subtasks

- [x] **Task 1: Create Auth Middleware File** (AC: #1, #2)
  - [x] Create `src/middleware/auth.ts`
  - [x] Export authMiddleware function
  - [x] Middleware signature: `(req, res, next) => void`
  - [x] Import jsonwebtoken for token verification

- [x] **Task 2: Extract Token from Header** (AC: #2, #3)
  - [x] Read Authorization header: `req.headers.authorization`
  - [x] Check header exists and starts with "Bearer "
  - [x] Extract token: `authorization.split(' ')[1]`
  - [x] Return 401 if no header or invalid format
  - [x] Error message: "No token provided"
  - [x] Test missing Authorization header returns 401

- [x] **Task 3: Verify and Decode Token** (AC: #2, #4)
  - [x] Use jwt.verify(token, JWT_SECRET) to validate token
  - [x] Catch TokenExpiredError for expired tokens
  - [x] Catch JsonWebTokenError for invalid tokens
  - [x] Return 401 for invalid/expired tokens
  - [x] Error message: "Invalid or expired token"
  - [x] Test expired token returns 401
  - [x] Test invalid token returns 401

- [x] **Task 4: Attach User to Request** (AC: #1, #2)
  - [x] Decode token payload (contains userId, email)
  - [x] Attach to req.user: `req.user = { userId: decoded.userId, email: decoded.email }`
  - [x] Extend Express Request type for TypeScript
  - [x] Call next() to proceed to route handler
  - [x] Test req.user contains correct userId and email

- [x] **Task 5: TypeScript Type Definitions** (AC: #1)
  - [x] Create custom type for authenticated request
  - [x] Extend Express.Request interface with user property
  - [x] Type user as `{ userId: number, email: string }`
  - [x] Export AuthRequest interface for use in route handlers

- [x] **Task 6: Create Test Endpoint /auth/me** (AC: #6)
  - [x] Add GET /me route to auth.ts
  - [x] Apply authMiddleware to protect endpoint
  - [x] Return current user from req.user
  - [x] Response: `{ success: true, data: { user: req.user } }`
  - [x] Test /auth/me with valid token returns user
  - [x] Test /auth/me without token returns 401

- [x] **Task 7: Error Handling Integration** (AC: #3, #4)
  - [x] Use sendError() utility for consistent error format
  - [x] Handle all JWT errors (expired, invalid, malformed)
  - [x] Return appropriate HTTP status codes (401)
  - [x] Log errors for debugging (without exposing sensitive data)
  - [x] Test error responses use consistent format from Story 1.5

- [x] **Task 8: Testing and Validation** (AC: #1-6)
  - [x] Test middleware allows request with valid token
  - [x] Test middleware attaches req.user correctly
  - [x] Test middleware rejects missing token
  - [x] Test middleware rejects invalid token
  - [x] Test middleware rejects expired token
  - [x] Test /auth/me endpoint returns current user
  - [x] Test middleware can be applied to multiple routes
  - [x] Test TypeScript types work correctly
  - [x] Document middleware usage in API documentation

## Dev Notes

### Architecture Alignment

**Authentication Architecture (from Architecture Document):**
- **JWT Verification:** Use jsonwebtoken.verify()
- **Middleware Pattern:** Express middleware function
- **Token Format:** Bearer token in Authorization header
- **User Context:** Attach decoded user to req.user

**Middleware Patterns:**
- Reusable middleware function
- Can be applied to individual routes or route groups
- Integrates with Express error handling
- Type-safe with TypeScript

**Authorization Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Learnings from Previous Story

**From Story 2.2: Implement User Login API (Status: drafted, previous in sequence)**

- **JWT Token Generation:**
  - Token created with jwt.sign() in Story 2.2
  - Payload contains: `{ userId, email }`
  - Signed with JWT_SECRET
  - Expires in 24 hours

- **Token Structure:**
  - Client receives token in login response
  - Client must send token in Authorization header for protected routes
  - Token verification uses same JWT_SECRET

- **Available Dependencies:**
  - jsonwebtoken already installed from Story 2.2
  - JWT_SECRET configured in environment variables
  - Response utilities (sendSuccess, sendError) available

- **Recommendations for This Story:**
  - Create reusable middleware in separate file
  - Use jwt.verify() with same JWT_SECRET from Story 2.2
  - Handle different JWT errors separately (expired vs. invalid)
  - Extend Express Request type for req.user
  - Test with tokens generated by Story 2.2 login endpoint

[Source: stories/2-2-implement-user-login-api-with-jwt-token-generation.md]

### Project Structure Notes

**New Files:**
```
backend/
└── src/
    └── middleware/
        └── auth.ts              # JWT authentication middleware
```

**Modified Files:**
```
backend/
└── src/
    └── routes/
        └── auth.ts              # Add GET /me test endpoint
```

**TypeScript Types:**
```
backend/
└── src/
    └── types/
        └── express.d.ts         # (Optional) Extend Express Request type
```

### Technical Constraints

**Prerequisites:**
- Story 2.2 completed (JWT token generation exists)
- Story 1.5 completed (response utilities exist)
- JWT_SECRET configured in environment

**Middleware Implementation:**
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 'NO_TOKEN', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
    };

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Invalid or expired token', 'TOKEN_EXPIRED', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
    }
    return sendError(res, 'Authentication failed', 'AUTH_ERROR', 401);
  }
};
```

**Usage Example:**
```typescript
// Protect individual route
router.get('/api/transactions', authMiddleware, getTransactions);

// Protect all routes in a router
router.use(authMiddleware);
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
```

**TypeScript Type Extension:**
```typescript
// src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
      };
    }
  }
}
```

### Testing Standards

- Test valid token allows access and sets req.user
- Test missing Authorization header returns 401
- Test malformed Authorization header returns 401
- Test invalid token returns 401
- Test expired token returns 401
- Test /auth/me endpoint returns current user
- Test middleware works on multiple routes
- Test error messages are consistent
- Verify JWT_SECRET is used for verification
- Test TypeScript types compile correctly

### Security Considerations

**Token Verification:**
- Always verify signature with JWT_SECRET
- Check token expiration
- Handle all JWT error types

**Error Messages:**
- Don't expose sensitive information in errors
- Generic messages for all auth failures
- Log detailed errors for debugging

**Type Safety:**
- TypeScript ensures req.user has correct structure
- Type guards for user existence in route handlers

### References

- [Source: docs/epics.md#Story-2.3-Create-Authentication-Middleware]
- [Source: docs/architecture.md#Authentication-JWT]
- [Source: stories/2-2-implement-user-login-api-with-jwt-token-generation.md]
- [Source: docs/PRD.md#User-Authentication-Account-Management]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

claude-sonnet-4-5-20250929 (Sonnet 4.5)

### Debug Log References

Implementation completed 2025-11-14 by Amelia (DEV agent)

### Completion Notes List

**Implementation Summary (2025-11-14):**
- Created JWT authentication middleware in `backend/src/middleware/auth.ts`
- Middleware extracts and verifies Bearer tokens from Authorization header
- Decodes JWT payload and attaches user (userId, email) to `req.user`
- Comprehensive error handling for missing, invalid, and expired tokens
- TypeScript interface `AuthRequest` extends Express Request with user property
- Added `/api/auth/me` test endpoint to verify authenticated user identity
- All error responses use consistent `sendError()` utility from Story 1.5

**Test Results:**
- ✓ AC1: Valid token authenticates and attaches user to req.user
- ✓ AC2: Middleware reads Bearer token, verifies signature, decodes payload
- ✓ AC3: Missing token returns 401 "No token provided"
- ✓ AC4: Invalid/malformed tokens return 401 "Invalid or expired token"
- ✓ AC5: Middleware is reusable and can be applied to any route
- ✓ AC6: GET /api/auth/me endpoint returns authenticated user info
- ✓ TypeScript compilation successful with no type errors
- ✓ All JWT error types handled (TokenExpiredError, JsonWebTokenError)

**Security Implementation:**
- Token verification uses same JWT_SECRET as token generation (Story 2.2)
- Error messages are generic to prevent information leakage
- All authentication failures return 401 with consistent format
- TypeScript ensures type safety for req.user access

### File List

**New Files:**
- `backend/src/middleware/auth.ts` - JWT authentication middleware with AuthRequest interface

**Modified Files:**
- `backend/src/routes/auth.ts` - Added GET /me endpoint with authMiddleware protection

## Change Log

- 2025-11-14: Story drafted by SM agent (Bob) from epics.md, architecture.md, and PRD.md
- 2025-11-14: Story implemented by DEV agent (Amelia) - All 8 tasks completed, all 6 ACs validated
