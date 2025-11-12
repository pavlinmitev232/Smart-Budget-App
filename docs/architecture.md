# Architecture Document: Smart Budget App

**Date:** 2025-11-13
**Project:** Smart-Budget-App
**Type:** Full-Stack Web Application (React + Express + PostgreSQL)
**Level:** 2 (BMad Method)
**Author:** pavlin (Architect Workflow)

---

## Executive Summary

This architecture document defines the technical decisions and implementation patterns for Smart Budget App, a personal finance management application. All AI agents implementing the 29 user stories across 5 epics must follow these architectural decisions to ensure consistency.

The architecture uses modern, industry-standard technologies: **Vite + React + TypeScript** for the frontend, **Express + TypeScript** for the backend, and **PostgreSQL with Prisma ORM** for data persistence. The frontend uses **Tailwind CSS** for styling, **React Hook Form** for forms, **Recharts** for data visualization, and **JWT** for authentication.

---

## 1. Project Initialization

**CRITICAL:** Story 1.1 (Initialize Project Structure) must execute the following commands as the first implementation step:

### Frontend Initialization

```bash
npm create vite@latest smart-budget-app -- --template react-ts
cd smart-budget-app
npm install
```

This establishes the base frontend architecture with these built-in decisions:
- ✅ React 18+ with TypeScript
- ✅ Vite 7.2 build tooling
- ✅ ESLint configured
- ✅ Hot Module Replacement (HMR)
- ✅ Project structure (src/, public/, index.html)

### Backend Initialization

Create backend structure manually following the feature-based pattern (see Section 4).

**Requirements:**
- Node.js 20.19+ or 22.12+ (required for Vite 7)
- PostgreSQL 14+ installed and running locally

---

## 2. Architectural Decisions Summary

| Category | Decision | Version/Details | Affects Epics | Rationale |
|----------|----------|-----------------|---------------|-----------|
| **Frontend Framework** | React + TypeScript | React 18+ | All | Industry standard, type safety |
| **Build Tool** | Vite | 7.2 | All | Fast HMR, modern ESM-based bundling |
| **Backend Framework** | Express.js + TypeScript | Express latest | All | Flexible, well-established Node.js framework |
| **Database** | PostgreSQL | 14+ | 1, 2, 3, 4 | Structured financial data, strong data integrity |
| **ORM** | Prisma | Latest (5.x+) | 1, 2, 3, 4 | Type-safe queries, auto-generated types |
| **Authentication** | JWT (JSON Web Tokens) | jsonwebtoken v9.0.2 | Epic 2 | Stateless, scalable, modern standard |
| **Password Hashing** | bcrypt | Latest | Epic 2 | Industry standard for password security |
| **State Management** | React Context API | Built-in | 2, 3, 4 | Sufficient for app complexity, no extra deps |
| **Routing** | React Router | v7.9.5 (react-router-dom) | 2, 3, 4, 5 | Protected routes, industry standard |
| **HTTP Client** | Axios | v1.13.2 | 2, 3, 4 | JWT interceptors, better error handling |
| **Styling** | Tailwind CSS | v4.1.17 | Epic 5 | Utility-first, responsive design support |
| **Form Handling** | React Hook Form | v7.66.0 | 2, 3 | Performance, validation, TypeScript support |
| **Charts** | Recharts | v3.4.1 | Epic 4 | React-native API, declarative syntax |
| **Date Handling** | date-fns | v4.1.0 | 3, 4 | Tree-shakable, small bundle |
| **Backend Structure** | Feature-based | N/A | All | Co-locate related code, maps to epics |

**Verification Date:** 2025-11-13
**All versions verified as latest stable releases**

---

## 3. Technology Stack Details

### Frontend Stack

```typescript
// package.json dependencies (frontend)
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^7.9.5",
    "axios": "^1.13.2",
    "react-hook-form": "^7.66.0",
    "recharts": "^3.4.1",
    "date-fns": "^4.1.0",
    "tailwindcss": "^4.1.17"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "vite": "^7.2",
    "@vitejs/plugin-react": "^4.x",
    "eslint": "^9.x"
  }
}
```

### Backend Stack

```typescript
// package.json dependencies (backend)
{
  "dependencies": {
    "express": "^4.x",
    "@prisma/client": "^5.x",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.x",
    "cors": "^2.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "@types/express": "^4.x",
    "@types/node": "^20.x",
    "@types/jsonwebtoken": "^9.x",
    "@types/bcrypt": "^5.x",
    "typescript": "^5.x",
    "tsx": "^4.x",
    "prisma": "^5.x"
  }
}
```

**TypeScript Configuration:**
- `strict: true` for both frontend and backend
- ES2022 target minimum
- Module resolution: bundler (frontend), node (backend)

---

## 4. Complete Project Structure

### Monorepo Structure (Recommended)

```
smart-budget-app/
├── frontend/                # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # Shared components (Button, Card, Input)
│   │   │   ├── auth/        # Auth-related components (LoginForm, RegisterForm)
│   │   │   ├── transactions/ # Transaction components (TransactionList, TransactionForm)
│   │   │   └── dashboard/   # Dashboard components (SummaryCard, Charts)
│   │   ├── pages/           # Page components (route targets)
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   └── Analytics.tsx
│   │   ├── contexts/        # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── TransactionContext.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useTransactions.ts
│   │   │   └── useAnalytics.ts
│   │   ├── services/        # API service layer (Axios)
│   │   │   ├── api.ts       # Axios instance with interceptors
│   │   │   ├── authService.ts
│   │   │   ├── transactionService.ts
│   │   │   └── analyticsService.ts
│   │   ├── utils/           # Helper functions
│   │   │   ├── formatters.ts # Currency, date formatters
│   │   │   └── validators.ts # Validation helpers
│   │   ├── types/           # TypeScript type definitions
│   │   │   ├── auth.types.ts
│   │   │   ├── transaction.types.ts
│   │   │   └── api.types.ts
│   │   ├── App.tsx          # Root component with routing
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Tailwind imports
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── tailwind.config.js   # Tailwind configuration
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript config
│   ├── package.json
│   └── .env                 # Environment variables (VITE_API_URL)
│
├── backend/                 # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── features/        # Feature-based modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts  # Request handlers
│   │   │   │   ├── auth.service.ts     # Business logic
│   │   │   │   ├── auth.routes.ts      # Route definitions
│   │   │   │   ├── auth.types.ts       # TypeScript types
│   │   │   │   └── auth.middleware.ts  # JWT verification
│   │   │   ├── transactions/
│   │   │   │   ├── transactions.controller.ts
│   │   │   │   ├── transactions.service.ts
│   │   │   │   ├── transactions.routes.ts
│   │   │   │   └── transactions.types.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   ├── analytics.routes.ts
│   │   │   │   └── analytics.types.ts
│   │   │   └── categories/
│   │   │       ├── categories.controller.ts
│   │   │       ├── categories.service.ts
│   │   │       └── categories.routes.ts
│   │   ├── middleware/      # Global middleware
│   │   │   ├── errorHandler.ts  # Global error handling
│   │   │   ├── logger.ts        # Request logging
│   │   │   └── validation.ts    # Request validation
│   │   ├── utils/           # Shared utilities
│   │   │   ├── prisma.ts    # Prisma client instance
│   │   │   └── response.ts  # Standard response formatters
│   │   ├── config/          # Configuration
│   │   │   ├── database.ts
│   │   │   └── auth.ts
│   │   └── server.ts        # Express app setup and entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Prisma schema definition
│   │   └── migrations/      # Database migrations (auto-generated)
│   ├── tsconfig.json        # TypeScript config
│   ├── package.json
│   └── .env                 # Environment variables (DATABASE_URL, JWT_SECRET)
│
├── docs/                    # Project documentation
│   ├── PRD.md
│   ├── epics.md
│   ├── architecture.md (this file)
│   └── bmm-workflow-status.yaml
│
└── README.md                # Project README

```

---

## 5. Epic to Architecture Mapping

| Epic | Frontend Components | Backend Features | Database Tables | Key Technologies |
|------|---------------------|------------------|-----------------|------------------|
| **Epic 1: Project Foundation** | N/A (infrastructure) | Server setup, Prisma setup | `users`, `transactions` schema | Vite, Express, Prisma, PostgreSQL |
| **Epic 2: User Authentication** | `Login.tsx`, `Register.tsx`, `AuthContext`, `ProtectedRoute` | `features/auth/` | `users` | JWT, bcrypt, React Router |
| **Epic 3: Transaction Management** | `TransactionList`, `TransactionForm`, `TransactionContext` | `features/transactions/`, `features/categories/` | `transactions`, `categories` | React Hook Form, Axios, Prisma |
| **Epic 4: Dashboard & Analytics** | `Dashboard`, `SummaryCard`, Charts (Pie, Bar, Line), DateRangePicker | `features/analytics/` | Aggregations on `transactions` | Recharts, date-fns |
| **Epic 5: UX & Polish** | `ErrorBoundary`, `LoadingSpinner`, `Toast`, Responsive layouts | Error middleware | N/A | Tailwind CSS, responsive design |

---

## 6. Integration Points

### Frontend ↔ Backend Communication

**Pattern:** RESTful API over HTTP

**Base URL:**
- Development: `http://localhost:5000/api`
- Production: Environment variable `VITE_API_URL`

**Authentication Flow:**
1. User submits login credentials
2. Backend validates, returns JWT token
3. Frontend stores token in `localStorage`
4. Axios interceptor attaches token to all requests: `Authorization: Bearer <token>`
5. Backend middleware validates token on protected routes

**Request/Response Cycle:**
```typescript
// Frontend (Axios service)
const response = await axios.post('/api/auth/login', { email, password });
// Backend returns: { success: true, data: { token, user } }

// Subsequent requests automatically include token via interceptor
const transactions = await axios.get('/api/transactions');
// Backend validates JWT, returns: { success: true, data: [...transactions] }
```

### Backend ↔ Database Communication

**Pattern:** Prisma ORM with type-safe queries

**Prisma Client Usage:**
```typescript
// In service files
import { prisma } from '@/utils/prisma';

// Type-safe query
const user = await prisma.user.findUnique({
  where: { email }
});

const transactions = await prisma.transaction.findMany({
  where: { userId },
  orderBy: { date: 'desc' }
});
```

**Migration Pattern:**
- Schema changes in `prisma/schema.prisma`
- Run `npx prisma migrate dev --name description`
- Prisma auto-generates types in `node_modules/.prisma/client`

---

## 7. Data Architecture (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int           @id @default(autoincrement())
  email        String        @unique
  passwordHash String        @map("password_hash")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  transactions Transaction[]

  @@map("users")
}

model Transaction {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  type          String   // 'income' or 'expense'
  amount        Decimal  @db.Decimal(10, 2) // CRITICAL: Financial precision
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

// Optional: Category reference table (can be hardcoded in backend instead)
model Category {
  id   Int    @id @default(autoincrement())
  name String @unique
  type String // 'income' or 'expense'

  @@map("categories")
}
```

**Key Data Decisions:**
- **Decimal precision:** Use `Decimal(10, 2)` for all currency amounts (prevents floating-point errors)
- **Timestamps:** All tables have `createdAt` and `updatedAt`
- **Indexes:** On frequently queried fields (`userId + date`, `userId + category`)
- **Cascading deletes:** Transactions deleted when user is deleted
- **Snake_case in DB, camelCase in code:** Prisma handles mapping with `@map()`

---

## 8. API Contracts

### Standard Response Format

**ALL API responses MUST follow this structure:**

**Success Response:**
```typescript
{
  "success": true,
  "data": <actual data>
}
```

**Error Response:**
```typescript
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE"
  }
}
```

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

#### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

#### GET /api/auth/me
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Transaction Endpoints

#### GET /api/transactions
**Headers:** `Authorization: Bearer <token>`
**Query Params:** `?type=expense&category=Food&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=50`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 1,
        "type": "expense",
        "amount": "45.50",
        "category": "Food & Dining",
        "date": "2025-01-15",
        "description": "Grocery shopping",
        "sourceVendor": "Whole Foods"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 156
    }
  }
}
```

#### POST /api/transactions
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "type": "expense",
  "amount": 45.50,
  "category": "Food & Dining",
  "date": "2025-01-15",
  "description": "Grocery shopping",
  "sourceVendor": "Whole Foods"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "type": "expense",
    "amount": "45.50",
    "category": "Food & Dining",
    "date": "2025-01-15",
    "description": "Grocery shopping",
    "sourceVendor": "Whole Foods",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### PUT /api/transactions/:id
**Headers:** `Authorization: Bearer <token>`

**Request:** Same as POST

**Response (200):** Updated transaction object

#### DELETE /api/transactions/:id
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Transaction deleted successfully"
  }
}
```

### Analytics Endpoints

#### GET /api/analytics/summary
**Headers:** `Authorization: Bearer <token>`
**Query Params:** `?startDate=2025-01-01&endDate=2025-01-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalIncome": "5000.00",
    "totalExpenses": "3250.75",
    "netBalance": "1749.25",
    "transactionCount": 45,
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    }
  }
}
```

#### GET /api/analytics/category-breakdown
**Headers:** `Authorization: Bearer <token>`
**Query Params:** `?startDate=2025-01-01&endDate=2025-01-31&type=expense`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "Food & Dining",
        "amount": "850.50",
        "percentage": 26.2,
        "count": 12
      },
      {
        "category": "Transportation",
        "amount": "420.00",
        "percentage": 12.9,
        "count": 8
      }
    ],
    "total": "3250.75"
  }
}
```

#### GET /api/analytics/trends
**Headers:** `Authorization: Bearer <token>`
**Query Params:** `?startDate=2025-01-01&endDate=2025-01-31&groupBy=week`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2025-01-01",
        "income": "2000.00",
        "expenses": "800.50"
      },
      {
        "period": "2025-01-08",
        "income": "500.00",
        "expenses": "1200.25"
      }
    ],
    "groupBy": "week"
  }
}
```

### Categories Endpoints

#### GET /api/categories
**Response (200):**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Salary", "type": "income" },
    { "id": 2, "name": "Freelance", "type": "income" },
    { "id": 3, "name": "Food & Dining", "type": "expense" },
    { "id": 4, "name": "Transportation", "type": "expense" }
  ]
}
```

### Error Responses

**HTTP Status Codes:**
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Valid token but insufficient permissions
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

**Error Example (400):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed: Amount must be greater than 0",
    "code": "VALIDATION_ERROR"
  }
}
```

---

## 9. Security Architecture

### Authentication & Authorization

**Strategy:** JWT (JSON Web Tokens)

**Token Generation:**
```typescript
// Backend: auth.service.ts
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);
```

**Token Validation Middleware:**
```typescript
// Backend: auth.middleware.ts
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required', code: 'NO_TOKEN' }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { message: 'Invalid token', code: 'INVALID_TOKEN' }
      });
    }
    req.user = user;
    next();
  });
};
```

**Frontend Token Storage:**
- Store token in `localStorage.setItem('token', token)`
- Axios interceptor adds token to all requests
- Clear token on logout: `localStorage.removeItem('token')`

**Password Security:**
```typescript
// Backend: auth.service.ts
import bcrypt from 'bcrypt';

// Hashing (registration)
const passwordHash = await bcrypt.hash(password, 10);

// Verification (login)
const isValid = await bcrypt.compare(password, user.passwordHash);
```

### Data Privacy

**Row-Level Security:**
- All queries filter by `userId` from JWT token
- Users can ONLY access their own data

```typescript
// Example: transactions.service.ts
const transactions = await prisma.transaction.findMany({
  where: { userId: req.user.userId } // From JWT payload
});
```

### Input Validation

**Backend Validation:**
- Validate all inputs before database operations
- Use TypeScript types + runtime validation
- Sanitize inputs to prevent SQL injection (Prisma handles this)

**Frontend Validation:**
- React Hook Form with validation rules
- Email format, password strength, required fields
- Display inline errors

### CORS Configuration

```typescript
// Backend: server.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### Environment Variables

**Backend (.env):**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/smart_budget"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=5000
NODE_ENV=development
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:5000/api
```

**CRITICAL:** Never commit `.env` files to version control. Use `.env.example` templates.

---

## 10. Implementation Patterns (Consistency Rules)

### Naming Conventions

**MUST FOLLOW - All AI agents use these patterns:**

#### API Endpoints
- **Pattern:** `/api/<resource-plural>/<optional-id>`
- **Examples:**
  - `GET /api/transactions`
  - `GET /api/transactions/:id`
  - `POST /api/transactions`
  - `PUT /api/transactions/:id`
  - `DELETE /api/transactions/:id`
- **Rule:** Always plural nouns, RESTful verbs via HTTP methods

#### Database Tables (Prisma)
- **Pattern:** `lowercase_snake_case`, plural
- **Examples:**
  - `users`
  - `transactions`
  - `categories`
- **Foreign Keys:** `camelCase` in Prisma schema: `userId`
- **Columns:** `snake_case` in database, `camelCase` in TypeScript (Prisma maps automatically)

#### React Components
- **Pattern:** `PascalCase` for files and component names
- **Examples:**
  - Files: `TransactionList.tsx`, `Dashboard.tsx`, `LoginForm.tsx`
  - Components: `<TransactionList />`, `<Dashboard />`, `<LoginForm />`
- **Rule:** One component per file, file name matches component name

#### TypeScript Types/Interfaces
- **Pattern:** `PascalCase`
- **Examples:**
  - `type User = { ... }`
  - `interface Transaction { ... }`
  - `type ApiResponse<T> = { ... }`
- **Rule:** No 'I' prefix for interfaces (use `Transaction` not `ITransaction`)

#### Variables and Functions
- **Pattern:** `camelCase`
- **Examples:**
  - `const userId = 123;`
  - `function fetchTransactions() { ... }`
  - `const handleSubmit = () => { ... };`

### File Organization Patterns

#### Frontend Component Organization
- **Pattern:** Group by feature, then by type
- **Shared components:** `src/components/common/`
- **Feature components:** `src/components/<feature>/`
- **Pages:** `src/pages/`

#### Backend Feature Organization
- **Pattern:** Feature-based modules
- **Structure:**
  ```
  features/<feature-name>/
  ├── <feature>.controller.ts   # HTTP request handling
  ├── <feature>.service.ts      # Business logic
  ├── <feature>.routes.ts       # Route definitions
  ├── <feature>.types.ts        # TypeScript types
  └── <feature>.middleware.ts   # Feature-specific middleware (optional)
  ```

#### Test File Location
- **Pattern:** Co-located with source files
- **Naming:** `<filename>.test.ts` or `<filename>.spec.ts`
- **Example:**
  - `transactions.service.ts`
  - `transactions.service.test.ts`

### Code Formatting Patterns

#### Import Order
```typescript
// 1. External libraries
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 2. Internal modules (absolute imports)
import { AuthContext } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/formatters';

// 3. Relative imports
import { TransactionForm } from './TransactionForm';

// 4. Types
import type { Transaction } from '@/types/transaction.types';
```

#### Async/Await Pattern
**MUST USE:** Always use `async/await` (not `.then()` chains)

```typescript
// ✅ CORRECT
const fetchData = async () => {
  try {
    const response = await axios.get('/api/transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// ❌ WRONG
const fetchData = () => {
  return axios.get('/api/transactions')
    .then(response => response.data)
    .catch(error => console.error(error));
};
```

### Error Handling Patterns

#### Backend Error Handling
```typescript
// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});
```

#### Frontend Error Handling
```typescript
// Service layer
try {
  const response = await axios.post('/api/transactions', data);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    // API error
    throw new Error(error.response?.data?.error?.message || 'Request failed');
  }
  // Network error
  throw new Error('Network error. Please check your connection.');
}

// Component layer
const handleSubmit = async (data) => {
  try {
    await transactionService.createTransaction(data);
    showToast('Transaction created successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
};
```

### State Management Patterns

#### Context Provider Pattern
```typescript
// AuthContext.tsx
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Validate token and fetch user
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const { data } = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### API Service Pattern

```typescript
// services/api.ts - Axios instance
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Interceptor: Add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Handle 401 errors (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// services/transactionService.ts
import { api } from './api';

export const transactionService = {
  getAll: async (filters?: TransactionFilters) => {
    const { data } = await api.get('/transactions', { params: filters });
    return data;
  },

  create: async (transaction: CreateTransactionDto) => {
    const { data } = await api.post('/transactions', transaction);
    return data;
  },

  update: async (id: number, transaction: UpdateTransactionDto) => {
    const { data } = await api.put(`/transactions/${id}`, transaction);
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/transactions/${id}`);
    return data;
  }
};
```

---

## 11. Development Environment Setup

### Prerequisites

1. **Node.js:** 20.19+ or 22.12+ (required for Vite 7)
2. **PostgreSQL:** 14+ installed and running
3. **Git:** For version control
4. **Code Editor:** VS Code recommended with extensions:
   - ESLint
   - Prettier
   - Prisma
   - Tailwind CSS IntelliSense

### Initial Setup Commands

```bash
# 1. Create project root
mkdir smart-budget-app
cd smart-budget-app

# 2. Initialize frontend (Vite)
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install frontend dependencies
npm install react-router-dom axios react-hook-form recharts date-fns tailwindcss
npm install -D @types/node

# Initialize Tailwind CSS
npx tailwindcss init -p

cd ..

# 3. Initialize backend
mkdir backend
cd backend
npm init -y
npm install express @prisma/client jsonwebtoken bcrypt cors dotenv
npm install -D typescript @types/express @types/node @types/jsonwebtoken @types/bcrypt tsx prisma

# Initialize TypeScript
npx tsc --init

# Initialize Prisma
npx prisma init

cd ..

# 4. Initialize Git
git init
# Add .gitignore (see below)
```

### .gitignore (Root)

```gitignore
# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment variables
.env
.env.local
.env.*.local
frontend/.env
backend/.env

# Build outputs
dist/
build/
frontend/dist/
backend/dist/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### Running the Application

**Development Mode:**

```bash
# Terminal 1: Backend
cd backend
npm run dev   # Uses tsx to run TypeScript

# Terminal 2: Frontend
cd frontend
npm run dev   # Vite dev server

# Terminal 3: Database (if not running)
# Start PostgreSQL service
```

**Backend package.json scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  }
}
```

**Frontend package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Database Setup

```bash
# 1. Create PostgreSQL database
createdb smart_budget

# 2. Set DATABASE_URL in backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_budget"

# 3. Run migrations
cd backend
npx prisma migrate dev --name init

# 4. Open Prisma Studio (optional - visual DB editor)
npx prisma studio
```

### Environment Variables

**backend/.env:**
```bash
DATABASE_URL="postgresql://localhost:5432/smart_budget"
JWT_SECRET="your-secret-key-change-in-production"
PORT=5000
NODE_ENV=development
```

**frontend/.env:**
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## 12. Architecture Decision Records (ADRs)

### ADR-001: Feature-Based Backend Structure
**Decision:** Use feature-based organization instead of layer-based (MVC)
**Rationale:** Related code stays together, maps cleanly to epics, easier to navigate
**Affects:** Epic 1, 2, 3, 4
**Alternatives Considered:** Layer-based (controllers/, services/, models/)

### ADR-002: JWT Over Session-Based Authentication
**Decision:** Use JWT tokens for authentication
**Rationale:** Stateless, scalable, modern standard for React + Express, no session storage needed
**Affects:** Epic 2
**Alternatives Considered:** Session-based with express-session

### ADR-003: Prisma Over Raw SQL
**Decision:** Use Prisma ORM for database interactions
**Rationale:** Type-safe queries, auto-generated types, migration management, prevents type mismatches
**Affects:** Epic 1, 2, 3, 4
**Alternatives Considered:** node-postgres (pg), TypeORM

### ADR-004: Tailwind CSS Over CSS-in-JS
**Decision:** Use Tailwind CSS for styling
**Rationale:** Utility-first approach speeds development, responsive design support, tree-shaking reduces bundle size
**Affects:** Epic 5
**Alternatives Considered:** Styled Components, CSS Modules

### ADR-005: React Hook Form Over Formik
**Decision:** Use React Hook Form for form handling
**Rationale:** Better performance (minimal re-renders), smaller bundle, modern approach
**Affects:** Epic 2 (login/register), Epic 3 (transaction forms)
**Alternatives Considered:** Formik, vanilla React state

### ADR-006: Recharts Over Chart.js
**Decision:** Use Recharts for data visualization
**Rationale:** React-native API (components), declarative syntax matches React patterns, TypeScript support
**Affects:** Epic 4 (dashboard analytics)
**Alternatives Considered:** Chart.js with react-chartjs-2

### ADR-007: Monorepo Structure
**Decision:** Use monorepo with separate frontend/ and backend/ folders
**Rationale:** Clear separation of concerns, can deploy independently if needed, simpler than separate repos
**Affects:** All epics
**Alternatives Considered:** Separate repositories, Nx/Turborepo monorepo tools

---

## 13. Performance Considerations

### Frontend Optimization

1. **Code Splitting:** React Router lazy loading for pages
2. **Tree Shaking:** Import only needed functions from libraries (date-fns, Recharts)
3. **Image Optimization:** Use WebP format, lazy load images
4. **Caching:** Axios cache for repeated API calls
5. **Debouncing:** Search/filter inputs debounced (300ms)

### Backend Optimization

1. **Database Indexes:** On `userId + date`, `userId + category` (already in schema)
2. **Query Optimization:** Use Prisma's `select` to fetch only needed fields
3. **Pagination:** Limit 50 items per page for transaction lists
4. **Connection Pooling:** Prisma handles automatically
5. **Caching:** Consider Redis for frequently accessed data (future enhancement)

### Bundle Size Targets

- **Frontend Initial Load:** < 300KB gzipped
- **Backend:** N/A (server-side)

---

## 14. Testing Strategy (Future Enhancement)

**Note:** Testing is out of MVP scope but architecture supports it.

### Frontend Testing
- **Unit Tests:** Jest + React Testing Library for components
- **Integration Tests:** Test user flows (login → create transaction)
- **E2E Tests:** Playwright or Cypress (optional)

### Backend Testing
- **Unit Tests:** Jest for service logic
- **Integration Tests:** Supertest for API endpoints
- **Database Tests:** In-memory SQLite for fast tests

### Test File Pattern
```
src/features/transactions/
├── transactions.service.ts
├── transactions.service.test.ts  ← Co-located
```

---

## 15. Deployment Architecture (Future)

**Note:** Deployment is out of MVP scope. This section is for future reference.

### Recommended Deployment Option: Railway

**Why Railway:**
- Full-stack deployment (frontend + backend + database)
- Automatic HTTPS
- GitHub integration
- PostgreSQL addon
- Free tier for development

**Deployment Structure:**
```
Railway Project
├── Frontend Service (Vite build)
├── Backend Service (Node.js)
└── PostgreSQL Database
```

**Alternative Options:**
- **Vercel (frontend) + Railway (backend + DB):** Separate concerns
- **Render:** Similar to Railway
- **Netlify + Supabase:** Frontend + BaaS

---

## 16. Validation Checklist

**Before implementation begins, verify:**

✅ Node.js 20.19+ installed
✅ PostgreSQL 14+ installed and running
✅ All architectural decisions documented
✅ Project structure defined
✅ API contracts specified
✅ Database schema defined in Prisma
✅ Naming conventions established
✅ Error handling patterns defined
✅ Security requirements (JWT, bcrypt) documented
✅ All 5 epics mapped to architectural components

---

## 17. Quick Reference for AI Agents

**When implementing any story, AI agents MUST:**

1. **Check Epic Mapping:** Identify which epic the story belongs to (Section 5)
2. **Follow Naming Conventions:** Use patterns from Section 10
3. **Use Standard Response Format:** All API responses follow Section 8
4. **Apply Security Patterns:** JWT validation, bcrypt hashing (Section 9)
5. **Respect Project Structure:** Place files in correct locations (Section 4)
6. **Use Decided Technologies:** Don't introduce new libraries (Section 2)
7. **Follow Error Handling:** Use standardized error patterns (Section 10)
8. **Type Safety:** Use TypeScript types, Prisma-generated types
9. **Consistency:** Match existing code patterns in adjacent stories

**Critical Files to Reference:**
- This architecture document (architecture.md)
- PRD (PRD.md) for functional requirements
- Epics (epics.md) for story acceptance criteria
- Prisma schema (prisma/schema.prisma) for database structure

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-13 | pavlin (Architect Workflow) | Initial architecture document created |

---

**End of Architecture Document**

This document serves as the **single source of truth** for all architectural decisions in the Smart Budget App project. All AI agents implementing user stories must adhere to these decisions to ensure consistency and prevent conflicts.
