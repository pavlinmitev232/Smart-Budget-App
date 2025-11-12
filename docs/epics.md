# Smart-Budget-App - Epic Breakdown

**Author:** pavlin
**Date:** 2025-11-12
**Project Level:** Level 2 (BMad Method)
**Target Scale:** 5 Epics, ~25-30 Stories

---

## Overview

This document provides the complete epic and story breakdown for Smart-Budget-App, decomposing the requirements from the [PRD](./PRD.md) into implementable stories.

This breakdown organizes the MVP development into 5 value-driven epics:

1. **Project Foundation & Infrastructure** - Establish technical foundation and deployment pipeline
2. **User Authentication & Access Control** - Secure user accounts and data privacy
3. **Transaction Management & Categories** - Core financial data capture and organization
4. **Financial Dashboard & Analytics** - Transform data into visual insights
5. **User Experience & Polish** - Responsive design and user feedback refinement

Each epic delivers independent value and maintains the system in a deployable state. Epic 1 establishes the foundation required for all subsequent work (greenfield pattern).

---

## Epic 1: Project Foundation & Infrastructure

**Goal:** Establish the technical foundation for Smart Budget App with a working full-stack development environment, deployment pipeline, and database connectivity.

**Value:** Creates the scaffolding and infrastructure that enables all subsequent feature development. Delivers a deployable "hello world" application proving the tech stack works end-to-end.

**Scope:** Project structure, React + Express setup, PostgreSQL initialization, environment configuration, basic CI/CD, development tooling.

---

### Story 1.1: Initialize Project Structure and Development Environment

As a developer,
I want a fully configured full-stack project with React frontend and Express backend,
So that I can begin feature development with proper tooling and structure in place.

**Acceptance Criteria:**

**Given** a new development machine
**When** I clone the repository and follow setup instructions
**Then** both frontend and backend servers start successfully

**And** the project includes:
- Root-level package.json with workspace configuration (or separate frontend/backend folders)
- React 18+ frontend initialized with Vite or Create React App
- Express.js backend with TypeScript/JavaScript setup
- ESLint and Prettier configured for both frontend and backend
- Git repository initialized with .gitignore for node_modules, .env files
- README.md with setup and run instructions

**And** I can access:
- Frontend at http://localhost:3000
- Backend at http://localhost:5000
- Both servers run concurrently with hot reload

**Prerequisites:** None (first story)

**Technical Notes:**
- Use Vite for faster React development
- Consider monorepo structure or separate frontend/backend folders
- Include scripts in package.json: `npm run dev`, `npm run dev:frontend`, `npm run dev:backend`
- Set up CORS configuration for local development
- Initialize basic folder structure: /src, /public, /routes, /controllers, /models

---

### Story 1.2: Set Up PostgreSQL Database and Connection

As a developer,
I want PostgreSQL database configured with connection pooling and migration system,
So that the application can persist data reliably with version-controlled schema changes.

**Acceptance Criteria:**

**Given** PostgreSQL 14+ is installed locally
**When** I run the database setup script
**Then** a `smart_budget` database is created

**And** the backend connects successfully to PostgreSQL using environment variables

**And** the project includes:
- Database connection module using `pg` package with connection pooling
- .env.example file documenting required environment variables (DATABASE_URL, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)
- Migration system initialized (using node-pg-migrate, Knex, or raw SQL migrations)
- Health check endpoint `/api/health` that verifies database connectivity

**And** database connection errors are handled gracefully with clear error messages

**Prerequisites:** Story 1.1 (project structure exists)

**Technical Notes:**
- Use connection pooling for better performance (pg.Pool)
- Store database credentials in .env file (never commit)
- Consider using node-pg-migrate for migration management
- Implement proper connection error handling and retry logic
- Database URL format: `postgresql://user:password@localhost:5432/smart_budget`

---

### Story 1.3: Create Database Schema with Users and Transactions Tables

As a developer,
I want the core database schema defined with proper constraints and indexes,
So that user and transaction data can be stored with data integrity and optimal query performance.

**Acceptance Criteria:**

**Given** database connection is established
**When** I run the schema migration
**Then** the database contains `users` and `transactions` tables with proper structure

**And** the `users` table includes:
- id (SERIAL PRIMARY KEY)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- created_at (TIMESTAMP DEFAULT NOW())
- updated_at (TIMESTAMP DEFAULT NOW())

**And** the `transactions` table includes:
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

**And** indexes are created:
- idx_user_date ON transactions(user_id, date DESC)
- idx_user_category ON transactions(user_id, category)
- idx_email ON users(email)

**And** I can verify schema with SQL query or migration status command

**Prerequisites:** Story 1.2 (database connection established)

**Technical Notes:**
- Use DECIMAL(10,2) for precise financial calculations (avoid floating point)
- Implement CASCADE deletion to remove user's transactions when user deleted
- Index on user_id + date DESC for efficient transaction history queries
- Index on user_id + category for category filtering
- Consider adding updated_at trigger for automatic timestamp updates
- Create migration file that can be rolled back if needed

---

### Story 1.4: Implement Environment Configuration and Secret Management

As a developer,
I want secure environment variable management for sensitive configuration,
So that secrets are never committed to version control and different environments can use different configs.

**Acceptance Criteria:**

**Given** the application needs database credentials and API secrets
**When** I configure the .env file locally
**Then** the application loads environment variables correctly

**And** the project includes:
- .env.example with all required variables documented (without values)
- .env in .gitignore to prevent accidental commits
- dotenv package configured to load variables at application startup
- Configuration module that validates required environment variables on startup

**And** the application fails fast with clear error message if required env variables are missing

**And** environment variables include:
- DATABASE_URL or DB_* connection details
- PORT (default: 5000 for backend, 3000 for frontend)
- NODE_ENV (development, production)
- JWT_SECRET or SESSION_SECRET (for future auth implementation)

**Prerequisites:** Story 1.1 (project structure exists)

**Technical Notes:**
- Use dotenv package for environment variable loading
- Load .env early in application bootstrap (before any imports)
- Create config validation function that checks required variables
- Provide sensible defaults where appropriate (PORT=5000)
- Document each variable's purpose in .env.example
- Never log sensitive values (passwords, secrets)

---

### Story 1.5: Create Basic API Structure with Health Check Endpoint

As a developer,
I want a structured Express API with routing and middleware foundation,
So that future endpoints follow consistent patterns and best practices.

**Acceptance Criteria:**

**Given** the Express backend is running
**When** I make a GET request to `/api/health`
**Then** I receive a 200 status with JSON response: `{ "status": "ok", "database": "connected", "timestamp": "<ISO date>" }`

**And** the backend includes:
- Routes folder with modular route files
- Middleware for JSON parsing (express.json())
- Middleware for CORS (allowing frontend origin)
- Global error handling middleware
- Request logging middleware (morgan or custom)
- 404 handler for unknown routes

**And** API responses follow consistent format:
- Success: `{ "success": true, "data": {...} }`
- Error: `{ "success": false, "error": { "message": "...", "code": "..." } }`

**And** health check endpoint verifies database connectivity

**Prerequisites:** Story 1.2 (database connection exists)

**Technical Notes:**
- Organize routes: /routes/index.js exports all route modules
- Use express.Router() for modular routes
- CORS config: allow localhost:3000 in development
- Implement centralized error handler that catches all errors
- Log requests with method, path, status code, response time
- Health check should test actual database query (SELECT 1)

---

## Epic 2: User Authentication & Access Control

**Goal:** Enable users to securely create accounts, authenticate, and access their personal financial data with proper session management and route protection.

**Value:** Establishes the security foundation for a multi-user financial application where data privacy is critical.

**Scope:** User registration, login/logout, password security (bcrypt), JWT or session-based authentication, protected API routes, frontend auth state management.

**FR Coverage:** FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, FR-AUTH-004, NFR-SEC-001, NFR-SEC-002

---

### Story 2.1: Implement User Registration API with Password Hashing

As a new user,
I want to register for an account with my email and password,
So that I can securely access my personal financial data.

**Acceptance Criteria:**

**Given** I have a valid email and password
**When** I POST to `/api/auth/register` with `{ email, password }`
**Then** a new user account is created in the database with hashed password

**And** the API validates:
- Email format is valid (contains @ and domain)
- Email is not already registered (returns 400 if duplicate)
- Password meets requirements: min 8 chars, 1 uppercase, 1 number, 1 special char
- Both email and password fields are present

**And** password is hashed using bcrypt with salt rounds ≥ 10 before storage

**And** successful registration returns 201 status with:
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "created_at": "..." }
  }
}
```

**And** validation errors return 400 with clear error messages

**And** duplicate email returns 409 Conflict with message "Email already registered"

**Prerequisites:** Story 1.3 (users table exists), Story 1.5 (API structure exists)

**Technical Notes:**
- Use bcrypt package for password hashing: `bcrypt.hash(password, 10)`
- Never return password_hash in API responses
- Implement input validation middleware or use express-validator
- Password regex: `/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/`
- Trim email and convert to lowercase before storage
- Consider email verification in future (not MVP)

---

### Story 2.2: Implement User Login API with JWT Token Generation

As a registered user,
I want to log in with my email and password,
So that I can access my account and financial data.

**Acceptance Criteria:**

**Given** I have a registered account
**When** I POST to `/api/auth/login` with `{ email, password }`
**Then** the API validates my credentials against the database

**And** successful login returns 200 status with JWT token:
```json
{
  "success": true,
  "data": {
    "token": "<JWT_TOKEN>",
    "user": { "id": 1, "email": "user@example.com" }
  }
}
```

**And** the JWT token:
- Contains user payload: `{ userId, email }`
- Expires in 24 hours
- Is signed with JWT_SECRET from environment variables

**And** invalid credentials return 401 Unauthorized with message "Invalid email or password"

**And** bcrypt is used to compare provided password with stored hash

**And** password comparison is done securely (constant-time comparison via bcrypt)

**Prerequisites:** Story 2.1 (user registration exists)

**Technical Notes:**
- Use jsonwebtoken package: `jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' })`
- Use bcrypt.compare() for password verification
- Never indicate whether email or password was incorrect (security)
- Return same generic error for invalid email or wrong password
- Generate JWT_SECRET and add to .env if not present
- Token should not contain sensitive data (no password hash)

---

### Story 2.3: Create Authentication Middleware for Protected Routes

As a developer,
I want JWT authentication middleware that protects API endpoints,
So that only authenticated users can access their own financial data.

**Acceptance Criteria:**

**Given** a protected API endpoint requires authentication
**When** a request includes a valid JWT token in the Authorization header
**Then** the middleware extracts user information and attaches it to `req.user`

**And** the middleware:
- Reads token from `Authorization: Bearer <token>` header
- Verifies token signature using JWT_SECRET
- Decodes token payload and attaches to `req.user = { userId, email }`
- Allows request to proceed to route handler

**And** requests without Authorization header return 401 with message "No token provided"

**And** requests with invalid/expired tokens return 401 with message "Invalid or expired token"

**And** the middleware is reusable and can be applied to any route:
```javascript
router.get('/api/transactions', authMiddleware, getTransactions);
```

**And** a test endpoint `/api/auth/me` returns current user info when authenticated

**Prerequisites:** Story 2.2 (JWT token generation exists)

**Technical Notes:**
- Create middleware function: `authMiddleware(req, res, next)`
- Use jwt.verify() to validate token
- Handle TokenExpiredError and JsonWebTokenError separately
- Extract token: `req.headers.authorization?.split(' ')[1]`
- Attach decoded user to req.user for use in route handlers
- Apply middleware to all routes that need authentication

---

### Story 2.4: Build Frontend Registration Form and Flow

As a new user,
I want a registration form in the React app,
So that I can create an account through an intuitive interface.

**Acceptance Criteria:**

**Given** I navigate to the registration page (`/register`)
**When** I see the registration form
**Then** the form includes fields for email and password with proper validation

**And** the form:
- Has email input (type="email")
- Has password input (type="password") with show/hide toggle
- Has submit button
- Displays validation rules for password (8+ chars, 1 uppercase, 1 number, 1 special)
- Shows real-time validation feedback (red/green indicators)

**And** when I submit valid credentials:
- Form data is POSTed to `/api/auth/register`
- Loading spinner appears during request
- On success (201): user is redirected to login page with success message
- On error (400/409): error message displayed above form

**And** form validation prevents submission with:
- Empty email or password
- Invalid email format
- Password not meeting requirements

**And** duplicate email error shows: "Email already registered. Please login."

**Prerequisites:** Story 2.1 (registration API exists), Story 1.1 (React app exists)

**Technical Notes:**
- Use React Hook Form or controlled components for form handling
- Implement client-side validation before API call
- Use axios or fetch for API requests
- Consider using React Router for navigation
- Display password strength indicator (weak/medium/strong)
- Use proper HTML5 input types and attributes
- Implement CSRF protection if using cookies

---

### Story 2.5: Build Frontend Login Form with Auth State Management

As a registered user,
I want a login form that manages my authenticated session,
So that I can access the application and remain logged in.

**Acceptance Criteria:**

**Given** I navigate to the login page (`/login`)
**When** I submit my credentials
**Then** the application authenticates me and manages my session state

**And** the login form:
- Has email and password inputs
- Has "Remember me" checkbox (optional)
- Has submit button
- Shows loading state during authentication
- Displays error messages for failed login

**And** successful login:
- Stores JWT token in localStorage or sessionStorage
- Updates global auth state (React Context or state management)
- Redirects to dashboard (`/dashboard`)
- Includes Authorization header in future API requests

**And** the app includes AuthContext provider:
- Provides `user` object (id, email)
- Provides `isAuthenticated` boolean
- Provides `login(token, user)` function
- Provides `logout()` function
- Checks for existing token on app load

**And** axios or fetch is configured to include token in headers:
```javascript
headers: { 'Authorization': `Bearer ${token}` }
```

**And** expired token triggers logout and redirect to login

**Prerequisites:** Story 2.2 (login API exists), Story 2.4 (frontend registration exists)

**Technical Notes:**
- Use React Context API for auth state (or Redux/Zustand)
- Store token in localStorage for persistence across refreshes
- Create axios interceptor to add Authorization header automatically
- Implement 401 response interceptor to handle token expiration
- Clear token and auth state on logout
- Check for token on app mount and validate with `/api/auth/me`

---

### Story 2.6: Implement Protected Routes and Logout Functionality

As an authenticated user,
I want protected routes that require login and ability to logout,
So that my data is secure and I can end my session.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to any protected route (dashboard, transactions, etc.)
**Then** I can access the page if authenticated, or am redirected to login if not

**And** the app includes ProtectedRoute component:
- Checks `isAuthenticated` from AuthContext
- Redirects to `/login` if not authenticated
- Renders protected component if authenticated
- Preserves intended destination for redirect after login

**And** protected routes include:
- `/dashboard` - Main application dashboard
- `/transactions` - Transaction list/management
- `/analytics` - Charts and analytics
- Any other authenticated pages

**And** public routes remain accessible without authentication:
- `/login`
- `/register`
- `/` (landing/home page redirects to dashboard if logged in)

**And** logout functionality:
- Logout button/link available in navigation when authenticated
- Clicking logout calls `/api/auth/logout` endpoint (optional)
- Clears JWT token from storage
- Clears auth state
- Redirects to login page

**And** navigation shows different options based on auth state:
- Not authenticated: Show "Login" and "Register" links
- Authenticated: Show "Dashboard", "Transactions", "Logout"

**Prerequisites:** Story 2.5 (frontend login and auth state exists), Story 2.3 (auth middleware exists)

**Technical Notes:**
- Create ProtectedRoute wrapper component for React Router
- Example: `<ProtectedRoute><Dashboard /></ProtectedRoute>`
- Store return URL in location state for post-login redirect
- Logout endpoint can be optional (client-side token removal sufficient)
- Consider implementing token refresh mechanism (future enhancement)
- Add logout confirmation dialog if desired (UX consideration)

---

## Epic 3: Transaction Management & Categories

**Goal:** Enable users to capture, organize, and manage their financial transactions with proper categorization and filtering capabilities.

**Value:** Delivers the core data capture functionality—users can now track their income and expenses, which is the foundation for all analysis and insights.

**Scope:** Full CRUD operations on transactions, predefined category system, transaction filtering by type/category/date, validation, and data persistence.

**FR Coverage:** FR-TRANS-001, FR-TRANS-002, FR-TRANS-003, FR-TRANS-004, FR-TRANS-005, FR-CAT-001, FR-CAT-002, NFR-DATA-001, NFR-DATA-002

---

### Story 3.1: Implement Categories API with Predefined List

As a user,
I want predefined income and expense categories available in the system,
So that I can categorize my transactions consistently.

**Acceptance Criteria:**

**Given** the application needs transaction categories
**When** I request the categories list from `/api/categories`
**Then** the API returns all predefined categories organized by type

**And** the response includes:
```json
{
  "success": true,
  "data": {
    "income": ["Salary", "Freelance", "Investments", "Gifts", "Other Income"],
    "expense": ["Food & Dining", "Transportation", "Housing", "Utilities", "Entertainment", "Healthcare", "Shopping", "Personal Care", "Education", "Other Expenses"]
  }
}
```

**And** categories are stored either:
- As hardcoded constants in backend code, OR
- In a `categories` database table (optional for MVP)

**And** the endpoint is publicly accessible (no auth required for reading categories)

**And** categories cannot be created, edited, or deleted via API (MVP scope limitation)

**Prerequisites:** Story 1.5 (API structure exists)

**Technical Notes:**
- For MVP, hardcoded category list in backend is acceptable
- Store as constant: `const CATEGORIES = { income: [...], expense: [...] }`
- If using database table, seed it via migration
- Future enhancement: allow custom categories per user
- Category names match those specified in PRD
- Consider caching categories in frontend after first fetch

---

### Story 3.2: Implement Create Transaction API Endpoint

As a user,
I want to create new income or expense transactions via API,
So that I can record my financial activities.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I POST to `/api/transactions` with transaction data
**Then** a new transaction is created and associated with my user account

**And** the request body includes:
```json
{
  "type": "income" | "expense",
  "amount": 150.50,
  "category": "Food & Dining",
  "date": "2025-11-12",
  "description": "Grocery shopping",
  "source_vendor": "Whole Foods"
}
```

**And** the API validates:
- User is authenticated (req.user.userId exists)
- `type` is either "income" or "expense" (required)
- `amount` is a positive decimal with max 2 decimal places (required)
- `category` exists in predefined list and matches type (required)
- `date` is valid date in YYYY-MM-DD format (required)
- `description` is optional text
- `source_vendor` is optional text

**And** successful creation returns 201 with:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": 1,
      "user_id": 1,
      "type": "expense",
      "amount": "150.50",
      "category": "Food & Dining",
      "date": "2025-11-12",
      "description": "Grocery shopping",
      "source_vendor": "Whole Foods",
      "created_at": "2025-11-12T10:30:00Z",
      "updated_at": "2025-11-12T10:30:00Z"
    }
  }
}
```

**And** validation errors return 400 with specific error messages

**And** amount is stored as DECIMAL(10,2) for precision

**Prerequisites:** Story 2.3 (auth middleware exists), Story 3.1 (categories exist), Story 1.3 (transactions table exists)

**Technical Notes:**
- Apply authMiddleware to protect endpoint
- Use express-validator or Joi for input validation
- Validate category against predefined list
- Convert amount to Decimal before database insertion
- Set user_id from req.user.userId (never trust client input)
- Use parameterized queries to prevent SQL injection
- Return created transaction with all fields including generated id

---

### Story 3.3: Implement Get Transactions API with Pagination and Filtering

As a user,
I want to retrieve my transaction history with filtering and pagination,
So that I can view and analyze my financial data efficiently.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I GET `/api/transactions` with optional query parameters
**Then** the API returns my transactions with pagination metadata

**And** supported query parameters:
- `page` (default: 1) - Page number
- `limit` (default: 50, max: 100) - Items per page
- `type` - Filter by "income" or "expense"
- `category` - Filter by specific category
- `startDate` - Filter transactions from this date (YYYY-MM-DD)
- `endDate` - Filter transactions up to this date (YYYY-MM-DD)
- `sortBy` (default: "date") - Sort field
- `sortOrder` (default: "desc") - "asc" or "desc"

**And** the response includes:
```json
{
  "success": true,
  "data": {
    "transactions": [/* array of transactions */],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 245,
      "itemsPerPage": 50
    }
  }
}
```

**And** transactions are filtered by user_id automatically (users only see their own data)

**And** filters can be combined (e.g., type=expense AND category=Food & Dining AND date range)

**And** default sort is by date descending (most recent first)

**And** empty result returns empty array with pagination metadata

**Prerequisites:** Story 3.2 (create transaction exists), Story 2.3 (auth middleware exists)

**Technical Notes:**
- Apply authMiddleware to protect endpoint
- Build dynamic SQL WHERE clause based on query params
- Always include `user_id = $userId` in WHERE clause
- Use LIMIT and OFFSET for pagination
- Perform COUNT query for total items
- Validate date format and range
- Index on user_id + date ensures fast queries
- Sanitize all query parameters

---

### Story 3.4: Implement Update and Delete Transaction API Endpoints

As a user,
I want to edit or delete my existing transactions,
So that I can correct mistakes or remove invalid entries.

**Acceptance Criteria:**

**Given** I am authenticated and own a transaction
**When** I PUT to `/api/transactions/:id` with updated data
**Then** my transaction is updated with the new values

**And** the update endpoint:
- Validates transaction belongs to authenticated user
- Accepts same fields as create (type, amount, category, date, description, source_vendor)
- Validates all fields like create endpoint
- Updates `updated_at` timestamp automatically
- Returns 200 with updated transaction
- Returns 404 if transaction not found or doesn't belong to user

**And** when I DELETE to `/api/transactions/:id`
**Then** my transaction is permanently removed

**And** the delete endpoint:
- Validates transaction belongs to authenticated user
- Removes transaction from database
- Returns 200 with success message: `{ "success": true, "message": "Transaction deleted" }`
- Returns 404 if transaction not found or doesn't belong to user

**And** both endpoints prevent cross-user access (user can only modify their own transactions)

**Prerequisites:** Story 3.3 (get transactions exists)

**Technical Notes:**
- Check `user_id = req.user.userId AND id = :id` in WHERE clause
- If no rows affected, return 404 (not 403, to avoid information leakage)
- For update: validate partial updates (allow updating subset of fields)
- For delete: use soft delete (add deleted_at column) or hard delete based on requirements
- Return full updated transaction object after PUT
- Consider adding deleted_at flag instead of hard delete for data recovery

---

### Story 3.5: Build Transaction Form Component (Create/Edit Mode)

As a user,
I want an intuitive form to add or edit transactions in the React app,
So that I can easily record my financial activities.

**Acceptance Criteria:**

**Given** I am on the transactions page
**When** I click "Add Transaction" or "Edit" on an existing transaction
**Then** a transaction form modal/page appears with appropriate fields

**And** the form includes:
- Type selector: Radio buttons or dropdown (Income/Expense)
- Amount input: Number field with 2 decimal places, $ prefix
- Category dropdown: Populated from `/api/categories`, filtered by type
- Date picker: Defaults to today, allows past/future dates
- Description textarea: Optional, multi-line
- Source/Vendor input: Optional, text field
- Submit button: "Add Transaction" or "Update Transaction"
- Cancel button: Closes form without saving

**And** when type changes (income ↔ expense):
- Category dropdown updates to show relevant categories
- Previously selected category clears if not valid for new type

**And** form validation prevents submission with:
- Empty amount or amount ≤ 0
- No category selected
- Invalid date format
- No type selected

**And** on successful submission:
- POST `/api/transactions` (create mode) or PUT `/api/transactions/:id` (edit mode)
- Loading spinner shown during API call
- On success: form closes, transaction list refreshes, success toast shown
- On error: error message displayed in form

**And** in edit mode:
- Form fields pre-populated with existing transaction data
- Title changes to "Edit Transaction"
- Submit button text changes to "Update Transaction"

**Prerequisites:** Story 3.2 (create API exists), Story 3.4 (update API exists), Story 3.1 (categories API exists)

**Technical Notes:**
- Use React Hook Form or controlled components
- Fetch categories on mount and cache in state
- Use date input type="date" or date picker library
- Format amount to 2 decimals on blur
- Consider using modal library (React Modal, Chakra UI, Material-UI)
- Reuse same component for create and edit (mode prop)
- Clear form after successful submission

---

### Story 3.6: Build Transaction List with Filtering and Actions

As a user,
I want to view all my transactions in a filterable list with edit/delete actions,
So that I can review and manage my financial history.

**Acceptance Criteria:**

**Given** I am authenticated and on the transactions page
**When** the page loads
**Then** I see my transaction history in a table/list format

**And** the transaction list displays:
- Date (formatted: MMM DD, YYYY)
- Type (Income/Expense with color coding: green/red)
- Category
- Description (truncated if long)
- Amount (formatted with $ and 2 decimals, green for income, red for expense)
- Actions: Edit and Delete buttons/icons

**And** filtering controls available:
- Type filter: All / Income / Expense
- Category dropdown: All categories + "All"
- Date range picker: Start date and End date
- "Clear Filters" button resets all filters

**And** pagination controls:
- Page numbers or Previous/Next buttons
- Items per page selector (25/50/100)
- Shows "Showing X-Y of Z transactions"

**And** when filters change:
- Fetch new data from `/api/transactions` with query params
- Update URL query string for bookmarkability
- Show loading state during fetch
- Update transaction list with filtered results

**And** empty state shown when:
- No transactions exist: "No transactions yet. Add your first transaction!"
- Filters return no results: "No transactions match your filters."

**And** clicking Edit:
- Opens transaction form in edit mode (Story 3.5)
- Pre-populates form with transaction data

**And** clicking Delete:
- Shows confirmation dialog: "Are you sure you want to delete this transaction?"
- On confirm: calls DELETE `/api/transactions/:id`
- On success: refreshes list, shows success toast
- On error: shows error message

**Prerequisites:** Story 3.3 (get transactions API exists), Story 3.4 (delete API exists), Story 3.5 (transaction form exists)

**Technical Notes:**
- Fetch transactions on component mount
- Store transactions in component state or React Query
- Use query parameters for filters (type, category, startDate, endDate, page)
- Visual distinction: income (green), expense (red)
- Implement optimistic UI for delete (remove from list immediately)
- Format currency with Intl.NumberFormat or library
- Consider infinite scroll as alternative to pagination
- Add sort by amount, date, category (optional)

---

## Epic 4: Financial Dashboard & Analytics

**Goal:** Transform transaction data into actionable visual insights through interactive charts, summary metrics, and time-based analytics.

**Value:** Delivers the product's core value proposition—"transform messy financial data into clear visual insights that drive better financial decisions."

**Scope:** Summary cards (income/expenses/balance), pie chart (category breakdown), bar/line charts (trends over time), time period filtering, responsive chart rendering.

**FR Coverage:** FR-DASH-001, FR-DASH-002, FR-DASH-003, FR-DASH-004, FR-DASH-005, FR-CAT-002, NFR-PERF-001

---

### Story 4.1: Implement Analytics API Endpoints for Dashboard Data

As a user,
I want the backend to calculate and provide aggregated financial analytics,
So that the frontend can display accurate summary metrics and chart data.

**Acceptance Criteria:**

**Given** I am authenticated
**When** I request analytics data for a specific time period
**Then** the API returns calculated financial summaries

**And** the following endpoints are implemented:

1. **GET /api/analytics/summary**
   - Query params: `startDate`, `endDate` (optional, defaults to current month)
   - Returns:
   ```json
   {
     "success": true,
     "data": {
       "totalIncome": "5000.00",
       "totalExpenses": "3250.75",
       "netBalance": "1749.25",
       "transactionCount": 45,
       "period": { "startDate": "2025-11-01", "endDate": "2025-11-30" }
     }
   }
   ```

2. **GET /api/analytics/category-breakdown**
   - Query params: `startDate`, `endDate`, `type` (income/expense)
   - Returns array of categories with amounts and percentages:
   ```json
   {
     "success": true,
     "data": {
       "categories": [
         { "category": "Food & Dining", "amount": "850.50", "percentage": 26.2, "count": 12 },
         { "category": "Transportation", "amount": "420.00", "percentage": 12.9, "count": 8 }
       ],
       "total": "3250.75"
     }
   }
   ```

3. **GET /api/analytics/trends**
   - Query params: `startDate`, `endDate`, `groupBy` (day/week/month)
   - Returns time-series data:
   ```json
   {
     "success": true,
     "data": {
       "trends": [
         { "period": "2025-11-01", "income": "2000.00", "expenses": "800.50" },
         { "period": "2025-11-08", "income": "500.00", "expenses": "1200.25" }
       ],
       "groupBy": "week"
     }
   }
   ```

**And** all endpoints:
- Filter data by user_id automatically (users see only their own data)
- Validate date range parameters
- Return empty/zero values for periods with no transactions
- Calculate percentages correctly (rounded to 1 decimal)
- Use DECIMAL precision for all currency calculations

**Prerequisites:** Story 3.3 (get transactions API exists)

**Technical Notes:**
- Use SQL aggregate functions: SUM(), COUNT(), GROUP BY
- For category breakdown: GROUP BY category, calculate percentage as (category_total / overall_total * 100)
- For trends: GROUP BY DATE_TRUNC('week', date) or similar
- Ensure date range validation (endDate >= startDate)
- Index on user_id + date ensures fast aggregation queries
- Consider caching for frequently requested periods

---

### Story 4.2: Build Dashboard Summary Cards with Real-Time Metrics

As a user,
I want to see my financial summary at a glance when I open the dashboard,
So that I can quickly understand my current financial status.

**Acceptance Criteria:**

**Given** I am authenticated and on the dashboard page
**When** the page loads
**Then** I see summary cards displaying my key financial metrics

**And** the dashboard includes four summary cards:

1. **Total Income Card**
   - Displays total income for selected period
   - Formatted as currency with $ symbol
   - Icon: upward arrow or income symbol
   - Color: green theme

2. **Total Expenses Card**
   - Displays total expenses for selected period
   - Formatted as currency
   - Icon: downward arrow or expense symbol
   - Color: red theme

3. **Net Balance Card**
   - Displays income minus expenses
   - Formatted as currency
   - Shows positive (green) or negative (red) based on value
   - Icon: balance scale or wallet

4. **Transaction Count Card**
   - Displays total number of transactions
   - Shows breakdown: "X income, Y expenses"
   - Icon: list or document

**And** each card includes:
- Large, prominent number display
- Label describing the metric
- Icon for visual identification
- Responsive sizing for mobile/tablet/desktop

**And** time period selector displayed above cards:
- Dropdown or button group with options:
  - "Current Month" (default)
  - "Last 30 Days"
  - "Last 3 Months"
  - "Custom Range" (opens date picker)
- Selected period applies to all dashboard components
- Period selection persists during session

**And** when time period changes:
- All cards update with new calculations
- Loading spinner shown during data fetch
- Smooth transition between values

**And** empty state handling:
- If no transactions exist: show "No transactions yet" message
- If no transactions in period: show zeros with "No transactions in this period"

**Prerequisites:** Story 4.1 (analytics API exists), Story 2.6 (protected routes exist)

**Technical Notes:**
- Fetch data from GET /api/analytics/summary
- Use React state to manage selected time period
- Format currency with Intl.NumberFormat or accounting.js
- Use CSS Grid or Flexbox for responsive card layout
- Consider using a card component library (Material-UI, Chakra)
- Store period selection in localStorage for persistence
- Debounce custom date range changes to avoid excessive API calls

---

### Story 4.3: Build Expense Distribution Pie Chart

As a user,
I want to see a pie chart showing how my expenses are distributed across categories,
So that I can identify my largest spending areas.

**Acceptance Criteria:**

**Given** I am authenticated and viewing the dashboard
**When** I look at the expense distribution section
**Then** I see a pie chart visualizing my spending by category

**And** the pie chart:
- Displays all expense categories with non-zero amounts
- Each slice represents a category's percentage of total expenses
- Slices sized proportionally to category amounts
- Color-coded with distinct colors for each category
- Includes legend mapping colors to category names

**And** interactive features:
- Hovering over slice shows tooltip with:
  - Category name
  - Amount (formatted as currency)
  - Percentage of total
  - Number of transactions
- Clicking slice (optional): filter transaction list to that category

**And** the chart responds to time period changes:
- Updates automatically when dashboard period filter changes
- Smooth animation when data changes
- Loading indicator during data fetch

**And** empty state handling:
- If no expenses in period: show "No expenses to display" message
- If only one category: still render pie (100% single slice)

**And** responsive behavior:
- Desktop: chart sized at ~400-500px diameter
- Tablet: scales down proportionally
- Mobile: full width with legend below chart

**Prerequisites:** Story 4.1 (analytics API exists), Story 4.2 (dashboard page exists)

**Technical Notes:**
- Use Recharts, Chart.js, or Victory for React charting
- Fetch data from GET /api/analytics/category-breakdown?type=expense
- Sort categories by amount (largest first)
- Limit to top 10 categories if more exist (group others as "Other")
- Use accessible color palette (colorblind-friendly)
- Consider donut chart variant (pie with center hole)
- Ensure legend is scrollable if many categories exist

---

### Story 4.4: Build Income vs Expenses Trend Chart

As a user,
I want to see a chart comparing my income and expenses over time,
So that I can identify spending patterns and months where I spent more than I earned.

**Acceptance Criteria:**

**Given** I am authenticated and viewing the dashboard
**When** I look at the trends section
**Then** I see a chart showing income and expenses over time

**And** the chart displays:
- X-axis: Time periods (days, weeks, or months based on date range)
- Y-axis: Amount (currency values)
- Two data series:
  - Income line/bars (green)
  - Expenses line/bars (red)
- Grid lines for easier value reading
- Legend indicating which line/bar is income vs expenses

**And** chart type options:
- Bar chart (default): Side-by-side bars for income and expenses
- Line chart (optional toggle): Two lines for comparison
- User can switch between chart types

**And** interactive features:
- Hover tooltip shows:
  - Period label (e.g., "Week of Nov 1-7" or "November 2025")
  - Income amount
  - Expenses amount
  - Net balance for that period (income - expenses)
- Clicking bar/point (optional): filter transaction list to that period

**And** time aggregation:
- For date ranges ≤ 31 days: group by day
- For date ranges 32-90 days: group by week
- For date ranges > 90 days: group by month
- X-axis labels formatted appropriately (e.g., "Nov 1", "Week 45", "November")

**And** responsive behavior:
- Desktop: full width, ~600px height
- Tablet/Mobile: scales down, may rotate to landscape or simplify labels

**And** empty state:
- If no data: "No transactions in this period"
- If only income or only expenses: still show both series (one will be zero)

**Prerequisites:** Story 4.1 (analytics API exists), Story 4.2 (dashboard page exists)

**Technical Notes:**
- Fetch data from GET /api/analytics/trends with appropriate groupBy
- Use Recharts BarChart or LineChart components
- Format Y-axis with currency symbols
- Format X-axis dates with date-fns or Moment.js
- Ensure zero values displayed (don't omit periods with no data)
- Consider adding a zero-line for visual reference
- Sync chart time period with dashboard period selector

---

### Story 4.5: Build Category Spending Bar Chart

As a user,
I want to see a horizontal bar chart ranking my spending by category,
So that I can quickly identify my top spending categories.

**Acceptance Criteria:**

**Given** I am authenticated and viewing the dashboard analytics
**When** I scroll to the category spending section
**Then** I see a horizontal bar chart showing spending by category

**And** the chart displays:
- Y-axis: Category names (sorted by amount, highest at top)
- X-axis: Amount spent (currency values)
- Bars colored consistently (single color or gradient)
- Shows top 10 categories (or fewer if less exist)
- Amount label at end of each bar

**And** the chart:
- Responds to time period changes from dashboard filter
- Updates smoothly with animation when data changes
- Shows loading state during fetch

**And** interactive features:
- Hover shows exact amount and transaction count
- Optional: Click bar to filter transaction list to that category

**And** responsive behavior:
- Desktop: horizontal layout, ~400-500px height
- Mobile: may switch to vertical bars or remain horizontal with scroll

**And** empty state:
- If no expenses: "No expense data for this period"

**Prerequisites:** Story 4.1 (analytics API exists), Story 4.2 (dashboard page exists)

**Technical Notes:**
- Fetch data from GET /api/analytics/category-breakdown?type=expense
- Use Recharts BarChart with layout="horizontal"
- Sort categories descending by amount before rendering
- Limit to top 10 for readability
- Format currency on X-axis and in tooltips
- Consider adding percentage labels on bars

---

### Story 4.6: Implement Custom Date Range Picker for Analytics

As a user,
I want to select custom date ranges for my dashboard analytics,
So that I can analyze my finances for any specific time period.

**Acceptance Criteria:**

**Given** I am on the dashboard
**When** I click the time period selector
**Then** I see predefined options plus a custom range option

**And** predefined options include:
- "Current Month" (1st of current month to today)
- "Last 30 Days" (today - 30 days to today)
- "Last 3 Months" (today - 90 days to today)
- "This Year" (Jan 1 to today)
- "Custom Range..." (opens date picker)

**And** when I select "Custom Range":
- Date picker modal/popover opens
- Shows two date inputs: Start Date and End Date
- Calendar UI for easy date selection
- Validates that end date >= start date
- Apply button to confirm selection
- Cancel button to dismiss without changes

**And** after selecting custom range:
- Time period label updates to show "Nov 1 - Nov 30, 2025"
- All dashboard components (cards, charts) update with new date range
- Selected range persists during session
- URL updates with query params (for bookmarking/sharing)

**And** validation and constraints:
- Cannot select future dates
- End date must be >= start date
- Maximum range of 1 year (optional constraint for performance)
- Clear error messages for invalid selections

**And** UX considerations:
- Quick shortcuts in date picker: "Last 7 days", "Last month", "Last year"
- Keyboard navigation supported (tab, arrow keys, enter)
- Mobile-friendly date picker (native input type="date" as fallback)

**Prerequisites:** Story 4.2 (dashboard exists), Story 4.1 (analytics API supports date ranges)

**Technical Notes:**
- Use date picker library: react-datepicker, react-day-picker, or MUI DatePicker
- Store selected period in React state and localStorage
- Update URL query params: ?startDate=2025-11-01&endDate=2025-11-30
- Parse query params on page load to restore saved period
- Pass date range to all analytics API calls
- Format dates consistently: YYYY-MM-DD for API, localized format for display
- Consider adding preset ranges as quick filters

---

## Epic 5: User Experience & Polish

**Goal:** Ensure the application provides an excellent user experience across devices with responsive design, intuitive navigation, proper feedback, and accessibility.

**Value:** Transforms functional software into a polished, professional application that users enjoy. Ensures mobile usability and creates a cohesive user experience.

**Scope:** Responsive layout implementation, global navigation, loading states, error handling, success notifications, empty states, accessibility improvements.

**FR Coverage:** FR-UI-001, FR-UI-002, FR-UI-003, NFR-USA-001, NFR-USA-002, NFR-PERF-002

---

### Story 5.1: Implement Responsive Layout and Mobile Navigation

As a user,
I want the application to work seamlessly on mobile, tablet, and desktop devices,
So that I can manage my finances from any device.

**Acceptance Criteria:**

**Given** I access the application from different devices
**When** the page loads
**Then** the layout adapts appropriately to my screen size

**And** responsive breakpoints are defined:
- **Mobile:** 320px - 767px (portrait phones, landscape phones)
- **Tablet:** 768px - 1023px (tablets, small laptops)
- **Desktop:** 1024px+ (laptops, desktops, large screens)

**And** on **Desktop** (1024px+):
- Full horizontal navigation bar with all menu items visible
- Dashboard cards in 4-column grid (or 2x2 if space constrained)
- Charts display side-by-side or in 2-column layout
- Transaction table shows all columns
- Forms display in wider modals/layouts

**And** on **Tablet** (768px-1023px):
- Horizontal navigation collapses to show fewer items or icons
- Dashboard cards in 2-column grid
- Charts stack vertically or remain side-by-side based on space
- Transaction table may hide less critical columns (source/vendor)
- Forms remain readable in narrower modals

**And** on **Mobile** (320px-767px):
- Hamburger menu icon reveals collapsible navigation drawer
- Navigation drawer slides in from left/right
- Dashboard cards stack vertically (1 column)
- All charts stack vertically at full width
- Transaction table switches to card-based layout (each row is a card)
- Forms full-width with stacked form fields
- Bottom navigation bar (optional) for key actions

**And** navigation drawer (mobile):
- Opens with slide-in animation
- Overlay backdrop dims background content
- Clicking outside drawer or backdrop closes it
- Includes all navigation links (Dashboard, Transactions, Analytics, Logout)
- User email/profile info displayed at top
- Close button (X) in top corner

**And** touch-friendly mobile interactions:
- All buttons minimum 44x44px touch target
- Adequate spacing between interactive elements
- Swipe gestures supported (optional: swipe transaction card to delete)

**And** responsive images and icons:
- Icons scale appropriately
- Charts remain legible at all sizes
- No horizontal scrolling required

**Prerequisites:** Story 2.6 (navigation exists), Story 3.6 (transaction list exists), Story 4.2 (dashboard exists)

**Technical Notes:**
- Use CSS media queries or styled-components for responsive breakpoints
- Consider using responsive UI framework (Material-UI, Chakra UI, Tailwind)
- Test on actual devices or browser dev tools device emulation
- Use CSS Flexbox/Grid for fluid layouts
- Implement React state for mobile menu toggle
- Use CSS transforms for smooth drawer animations
- Add viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`

---

### Story 5.2: Build Global Navigation with Active State Indicators

As a user,
I want clear, consistent navigation throughout the application,
So that I always know where I am and can easily move between sections.

**Acceptance Criteria:**

**Given** I am logged into the application
**When** I am on any page
**Then** I see the global navigation with my current location highlighted

**And** navigation structure includes:
- **Logo/App Name:** Links to dashboard, top-left position
- **Main Menu Items:**
  - Dashboard (icon + label)
  - Transactions (icon + label)
  - Analytics (icon + label, may be same as Dashboard depending on design)
- **User Menu:**
  - User avatar or email display
  - Dropdown with options: Profile (future), Settings (future), Logout

**And** active page indication:
- Current page menu item highlighted with:
  - Different background color or underline
  - Bolder font weight
  - Icon color change
  - Visual indicator (bar, dot, etc.)
- Clear visual distinction from inactive items

**And** navigation behavior:
- Clicking menu item navigates to that page
- Smooth page transitions (no jarring jumps)
- Active state updates immediately on navigation
- URL updates to reflect current page

**And** desktop navigation:
- Fixed horizontal nav bar at top of page
- Always visible (sticky/fixed position)
- Shows all menu items with icons and labels
- User menu in top-right corner

**And** mobile navigation:
- Hamburger icon in top-left or top-right
- App name/logo centered or left-aligned
- User avatar/icon in opposite corner from hamburger
- Drawer menu (from Story 5.1) contains all navigation links

**And** accessibility:
- Keyboard navigation: Tab through menu items, Enter to activate
- ARIA labels for screen readers
- Focus visible on keyboard navigation
- Semantic HTML: `<nav>`, `<a>`, proper heading structure

**Prerequisites:** Story 2.6 (auth and protected routes exist), Story 5.1 (responsive layout exists)

**Technical Notes:**
- Use React Router's `NavLink` component for automatic active state
- Apply active class styling with CSS or styled-components
- Create reusable Navigation component
- Use React Router `useLocation` hook to detect current page
- Implement user dropdown with toggle state
- Logout button triggers auth context logout function
- Consider breadcrumbs for deeper navigation (future enhancement)

---

### Story 5.3: Implement Toast Notifications for User Feedback

As a user,
I want to receive immediate visual feedback when I perform actions,
So that I know whether my actions succeeded or failed.

**Acceptance Criteria:**

**Given** I perform any action in the application
**When** the action completes (success or failure)
**Then** I see a toast notification with appropriate feedback

**And** toast notifications appear for:
- **Success actions:**
  - Transaction created: "Transaction added successfully"
  - Transaction updated: "Transaction updated successfully"
  - Transaction deleted: "Transaction deleted successfully"
  - Login: "Welcome back!"
  - Registration: "Account created successfully"
- **Error actions:**
  - API errors: "Failed to save transaction. Please try again."
  - Network errors: "Connection lost. Please check your internet."
  - Validation errors: "Please fix the errors in the form."
  - Authentication errors: "Session expired. Please log in again."

**And** toast appearance:
- **Success toasts:** Green background, checkmark icon
- **Error toasts:** Red background, error/warning icon
- **Info toasts:** Blue background, info icon (for neutral messages)
- **Warning toasts:** Orange/yellow background, warning icon

**And** toast behavior:
- Appears in top-right corner (or top-center on mobile)
- Slides in with smooth animation
- Displays for 3-5 seconds (configurable by type)
- Auto-dismisses after timeout
- Can be manually dismissed with X button
- Multiple toasts stack vertically
- Clicking toast (optional): dismisses it

**And** toast content:
- Clear, concise message (1-2 sentences max)
- Icon indicating success/error/info/warning
- Optional action button (e.g., "Undo" for deletions)
- Accessible to screen readers

**And** edge cases:
- Rapid actions don't create toast spam (rate limiting or batching)
- Toasts don't block critical UI elements
- Toasts work on all screen sizes

**Prerequisites:** Story 3.5 (transaction form exists), Story 3.6 (transaction list exists)

**Technical Notes:**
- Use toast library: react-toastify, react-hot-toast, or Chakra/MUI toast
- Create toast utility functions: `showSuccess()`, `showError()`, `showInfo()`
- Trigger toasts from API response handlers
- Position toasts with `position: fixed` and z-index above other content
- Implement toast queue to manage multiple simultaneous toasts
- Ensure toasts are accessible (ARIA live regions)
- Test toast behavior on slow network connections

---

### Story 5.4: Add Loading States and Skeleton Screens

As a user,
I want to see visual feedback when data is loading,
So that I know the application is working and don't think it's frozen.

**Acceptance Criteria:**

**Given** I perform an action that requires data fetching
**When** the request is in progress
**Then** I see appropriate loading indicators

**And** loading indicators are implemented for:

1. **Transaction List:**
   - Skeleton screens: gray placeholder boxes matching table row layout
   - Shows 5-10 skeleton rows while loading
   - Replaces skeletons with actual data when loaded

2. **Dashboard Summary Cards:**
   - Each card shows loading spinner or pulsing skeleton
   - Number placeholders pulse/shimmer
   - Replaced with real numbers when data loads

3. **Charts:**
   - Centered loading spinner in chart area
   - Or skeleton shape matching chart type (bars, pie, line)
   - Chart renders smoothly when data arrives

4. **Forms (Transaction Create/Edit):**
   - Submit button shows spinner when saving
   - Button text changes: "Save" → "Saving..."
   - Button disabled during submission to prevent double-submit

5. **Login/Registration:**
   - Submit button shows spinner during authentication
   - Form fields disabled during submission

6. **Page Transitions:**
   - Top progress bar (optional) during navigation
   - Or brief loading spinner on protected route checks

**And** loading state types:

- **Spinner:** For buttons, small inline loads
  - Circular spinner icon
  - Placed inline with text or replaces it

- **Skeleton Screens:** For lists, cards, content blocks
  - Gray placeholder shapes matching final content
  - Subtle pulse/shimmer animation
  - Better UX than blank screen or spinner

- **Progress Bar:** For long operations (file uploads, etc.)
  - Horizontal bar showing % complete
  - Not needed for MVP but consider for future

**And** loading state behavior:
- Appears immediately when action triggered (no delay)
- Minimum display time: 300ms (prevents flash for fast requests)
- Gracefully handles slow networks (doesn't freeze UI)
- Error states replace loading states if request fails

**And** accessibility:
- Loading states announced to screen readers
- ARIA live regions for dynamic content updates
- Focus management (don't lose focus during loading)

**Prerequisites:** Story 3.6 (transaction list), Story 4.2 (dashboard), Story 3.5 (forms)

**Technical Notes:**
- Use React state to track loading: `const [isLoading, setIsLoading] = useState(false)`
- Set isLoading=true before API call, false in finally block
- Use skeleton library: react-loading-skeleton, react-placeholder
- Create reusable Loading component
- Use CSS animations for spinners and skeletons (keyframe pulses)
- Consider React Suspense for lazy-loaded components (future)
- Implement request debouncing to avoid loading flicker

---

### Story 5.5: Implement Comprehensive Error Handling and Error Boundaries

As a user,
I want clear error messages when something goes wrong,
So that I understand the issue and know what to do next.

**Acceptance Criteria:**

**Given** an error occurs in the application
**When** I encounter the error
**Then** I see a user-friendly error message with guidance

**And** error types handled:

1. **Form Validation Errors:**
   - Display inline below/beside invalid field
   - Red text and/or red border on field
   - Specific message: "Email is required", "Password must be 8+ characters"
   - Clear errors when field is corrected

2. **API Errors (4xx/5xx):**
   - Display toast notification (from Story 5.3)
   - Message based on error code:
     - 400: "Invalid data. Please check your inputs."
     - 401: "Session expired. Please log in again." (redirect to login)
     - 403: "You don't have permission to do that."
     - 404: "Requested data not found."
     - 500: "Server error. Please try again later."
   - Log detailed error to console for debugging

3. **Network Errors:**
   - Detect offline status or failed requests
   - Toast: "No internet connection. Please check your network."
   - Optional: Show offline banner at top of page
   - Retry mechanism for failed requests (optional)

4. **React Runtime Errors:**
   - Error boundary component catches JavaScript errors
   - Shows fallback UI: "Something went wrong. Please refresh the page."
   - Provides "Refresh" button
   - Logs error details to console (or error tracking service)

5. **Authentication Errors:**
   - Expired token: redirect to login with message
   - Invalid credentials: inline error in login form
   - Registration errors: inline form validation

**And** error UI components:

- **Inline Errors:** Form fields
  - Red text below input
  - Red border on input
  - Error icon next to message

- **Error Toasts:** Global actions
  - Red background
  - Error icon
  - Actionable message when possible

- **Error Pages:** Critical failures
  - 404 Page: "Page Not Found" with link to dashboard
  - 500 Error: "Server Error" with refresh button
  - Fallback UI from error boundary

**And** error recovery:

- Forms: User can edit and resubmit
- API errors: Retry button or automatic retry after delay
- Error boundaries: Refresh button to reset component tree
- Network errors: Auto-retry when connection restored

**And** error logging:

- Console errors in development
- Error tracking service integration (future: Sentry, LogRocket)
- Include context: user ID, timestamp, error stack, action taken

**And** user guidance:

- Errors explain what went wrong
- Messages suggest how to fix issue
- Avoid technical jargon
- Provide next steps or contact info for unrecoverable errors

**Prerequisites:** All previous stories (comprehensive across app)

**Technical Notes:**
- Create Error Boundary component: `componentDidCatch()` or `react-error-boundary` library
- Wrap app or route components with error boundary
- Create centralized error handling utility function
- Use axios interceptors to handle API errors globally
- Implement retry logic with exponential backoff
- Add online/offline event listeners: `window.addEventListener('online/offline')`
- Form validation: use Yup or Joi schema validation
- Create reusable Error component for consistent styling

---

### Story 5.6: Add Empty States and Onboarding Guidance

As a new user,
I want helpful guidance when sections are empty,
So that I know what to do next and how to use the application.

**Acceptance Criteria:**

**Given** I am a new user or viewing an empty section
**When** I access that section
**Then** I see an empty state with clear guidance

**And** empty states are shown for:

1. **Empty Transaction List:**
   - Icon: empty folder or document
   - Message: "No transactions yet"
   - Guidance: "Start tracking your finances by adding your first transaction"
   - Call-to-action button: "Add Transaction"
   - Button opens transaction form (Story 3.5)

2. **Filtered Results Empty:**
   - Icon: search or filter icon
   - Message: "No transactions match your filters"
   - Guidance: "Try adjusting your filters or date range"
   - Button: "Clear Filters"

3. **Empty Dashboard (No Transactions):**
   - Welcome message: "Welcome to Smart Budget App!"
   - Summary cards show zeros
   - Empty chart states (from Epic 4 stories)
   - Prominent "Add Your First Transaction" CTA
   - Optional: Quick start guide or tutorial tips

4. **Empty Category (No Expenses in Category):**
   - Message: "No expenses in this category yet"
   - Chart shows empty state or single color indicating no data

**And** empty state design:

- **Visual Elements:**
  - Friendly icon or illustration
  - Large, readable heading
  - Explanatory subtext
  - Primary action button (when applicable)

- **Positioning:**
  - Centered in content area
  - Takes full width/height of container
  - Doesn't look broken (clearly intentional empty state)

- **Tone:**
  - Encouraging, not discouraging
  - Actionable guidance
  - Clear next steps

**And** onboarding elements (optional but nice to have):

- **First Login:**
  - Brief welcome modal: "Welcome! Here's how to get started..."
  - Quick tour: Highlight key areas (Add Transaction, Dashboard, etc.)
  - Skip option for advanced users

- **Feature Discovery:**
  - Tooltips on first use: "Click here to filter transactions"
  - Dismissible hints
  - Don't show again option

- **Help Links:**
  - Question mark icons with tooltips
  - Link to documentation or help section (future)

**And** empty state triggers:

- Transaction list with 0 items
- Filtered results with 0 matches
- Category with 0 transactions
- New user (first login, no data)
- Chart with no data points

**And** transitioning from empty state:

- When user adds first transaction: empty state disappears
- Smooth transition to populated state
- Congratulatory message (optional): "Great! Your first transaction is recorded."

**Prerequisites:** Story 3.6 (transaction list), Story 4.2 (dashboard), Story 3.5 (transaction form)

**Technical Notes:**
- Create reusable EmptyState component with props: icon, title, message, buttonText, onButtonClick
- Conditionally render: `{items.length === 0 ? <EmptyState /> : <ItemList />}`
- Use CSS for centering and spacing
- Consider illustration library for friendly graphics
- Store onboarding state in localStorage: `hasSeenWelcome`
- Use libraries like react-joyride for product tours (optional)
- Ensure empty states are accessible (proper heading hierarchy, alt text)

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
