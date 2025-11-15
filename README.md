# Smart Budget App 💰

A modern, full-stack personal finance management application that helps you track income and expenses, visualize spending patterns, and gain insights into your financial habits.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-complete-success.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 📋 What Does This App Do?

**Smart Budget App** is a comprehensive personal finance tracker that helps you:

- ✅ **Track Transactions** - Record income and expenses with detailed categorization
- 📊 **Visualize Spending** - Interactive charts showing expense distribution, trends, and category breakdowns
- 💳 **Manage Categories** - 15 predefined categories (5 income, 10 expense) with emoji icons
- 🔐 **Secure Authentication** - JWT-based user authentication with password hashing
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔍 **Advanced Filtering** - Filter transactions by type, category, and date range with pagination
- 📈 **Financial Dashboard** - Real-time metrics: total income, expenses, net balance, and transaction counts
- 🌓 **Smart Empty States** - Helpful guidance for new users with onboarding tips
- ⚡ **Real-time Updates** - Instant feedback with toast notifications and loading states
- 🛡️ **Error Handling** - Comprehensive error boundaries and recovery options

---

## 🚀 Tech Stack

### Frontend
- **React 18** with **TypeScript** - Type-safe UI development
- **Vite 7.2** - Lightning-fast build tool with Hot Module Replacement
- **Tailwind CSS 3.4** - Utility-first styling framework
- **React Router v6** - Client-side routing
- **React Hook Form 7.66** - Performant form validation
- **Recharts** - Interactive data visualization charts
- **React Toastify** - Toast notifications
- **Axios** - HTTP client for API requests
- **date-fns** - Date formatting and manipulation

### Backend
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **PostgreSQL 14+** - Relational database
- **Prisma ORM** - Type-safe database queries
- **JWT (jsonwebtoken)** - Secure authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Runtime type validation

### Development
- **Concurrently** - Run multiple servers simultaneously
- **Nodemon** - Auto-restart on file changes
- **Prettier** - Code formatting

---

## 📦 Prerequisites

Before you begin, ensure you have installed:

### Required Software

1. **Node.js** (v20.19+ or v22.12+)
   - Check: `node --version`
   - Download: [nodejs.org](https://nodejs.org/)

2. **PostgreSQL** (v14 or higher)
   - Check: `psql --version`
   - Download: [postgresql.org](https://www.postgresql.org/download/)
   - **OR** use Docker (recommended): `docker --version`

3. **npm** (comes with Node.js)
   - Check: `npm --version`

4. **Git** (for cloning the repository)
   - Check: `git --version`
   - Download: [git-scm.com](https://git-scm.com/)

---

## 🛠️ Local Development Setup

Follow these steps to get the app running on your local machine:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd smart-budget-app
```

### Step 2: Install Dependencies

Install all dependencies (root, frontend, and backend):

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 3: Set Up PostgreSQL Database

**Option A: Using Docker (Recommended)**

```bash
# Start PostgreSQL in Docker
docker run --name smart-budget-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=smart_budget \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps
```

**Option B: Using Local PostgreSQL**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE smart_budget;

# Exit
\q
```

### Step 4: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# From project root
cd backend
cp .env.example .env
```

Edit `backend/.env` with your database credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_budget?schema=public"

# JWT Secret (use a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

### Step 5: Initialize Database Schema

Run Prisma migrations to create database tables:

```bash
cd backend
npx prisma migrate deploy
cd ..
```

**Optional:** View your database in Prisma Studio:

```bash
cd backend
npx prisma studio
# Opens at http://localhost:5555
```

### Step 6: Start the Application

**Start Both Servers (Recommended):**

```bash
# From project root
npm run dev
```

This command starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

**Or Start Individually:**

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Step 7: Access the Application

1. Open your browser and navigate to **http://localhost:3000**
2. Click **"Create a new account"** to register
3. Fill in email and password (min 8 characters)
4. After registration, you'll be redirected to the dashboard
5. Start adding transactions!

---

## 📱 Using the Application

### First-Time User Flow

1. **Register** → Create your account with email and password
2. **Dashboard** → See the welcome screen with quick start tips
3. **Add Transaction** → Click the button to add your first transaction
4. **View Insights** → Charts and metrics automatically populate as you add more transactions

### Key Features to Explore

- **Dashboard** - Financial summary with interactive charts
- **Transactions** - Full CRUD operations (Create, Read, Update, Delete)
- **Filtering** - Filter by transaction type, category, and date range
- **Mobile Navigation** - Try the hamburger menu on smaller screens

---

## 🏗️ Project Structure

```
smart-budget-app/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── dashboard/    # Dashboard-specific components
│   │   │   ├── transactions/ # Transaction-specific components
│   │   │   ├── Navigation.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorFallback.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── context/          # React Context (Auth)
│   │   ├── services/         # API client (Axios)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Utility functions
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx
│   └── package.json
│
├── backend/                  # Express API server
│   ├── src/
│   │   ├── features/         # Feature-based architecture
│   │   │   ├── auth/         # Authentication endpoints
│   │   │   ├── categories/   # Category endpoints
│   │   │   ├── transactions/ # Transaction CRUD
│   │   │   └── analytics/    # Analytics endpoints
│   │   ├── middleware/       # Express middleware
│   │   │   └── auth.ts       # JWT authentication
│   │   ├── utils/            # Utility functions
│   │   └── index.ts          # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Database migrations
│   ├── .env                  # Environment variables (create this)
│   └── package.json
│
├── docs/                     # Project documentation
│   ├── PRD.md               # Product Requirements
│   ├── architecture.md      # Technical decisions
│   └── epics.md             # Feature breakdown
│
├── .bmad/                   # BMad Method framework
├── .bmad-ephemeral/         # Story files (29 stories)
├── package.json             # Root workspace config
└── README.md                # This file
```

---

## 🧪 Available Scripts

### Root Commands (run from project root)

```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only (port 3000)
npm run dev:backend      # Start backend only (port 5000)
npm run format           # Format all code with Prettier
npm run format:check     # Check code formatting
```

### Backend Commands (run from `backend/` directory)

```bash
npm run dev              # Start backend with nodemon
npm run build            # Compile TypeScript
npm start                # Run compiled JavaScript
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create new migration
npx prisma generate      # Regenerate Prisma Client
```

### Frontend Commands (run from `frontend/` directory)

```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

---

## 🔧 Troubleshooting

### Database Connection Issues

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps                              # For Docker
pg_isready -h localhost -p 5432       # For local PostgreSQL

# Restart PostgreSQL
docker restart smart-budget-db        # For Docker
sudo service postgresql restart       # For Linux
brew services restart postgresql@14   # For macOS with Homebrew
```

### Port Already in Use

**Error:** `Port 3000 (or 5000) is already in use`

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill           # macOS/Linux
netstat -ano | findstr :3000          # Windows (find PID, then taskkill /PID <pid> /F)

# Or change the port in vite.config.ts (frontend) or .env (backend)
```

### Missing Dependencies

**Error:** `Cannot find module...`

**Solution:**
```bash
# Reinstall all dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### Prisma Schema Changes Not Reflected

**Solution:**
```bash
cd backend
npx prisma generate              # Regenerate Prisma Client
npx prisma migrate deploy        # Apply migrations
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Categories
- `GET /api/categories` - Get all categories

### Transactions
- `POST /api/transactions` - Create transaction (protected)
- `GET /api/transactions` - List transactions with filters (protected)
- `PUT /api/transactions/:id` - Update transaction (protected)
- `DELETE /api/transactions/:id` - Delete transaction (protected)

### Analytics
- `GET /api/analytics/summary` - Financial summary (protected)
- `GET /api/analytics/category-breakdown` - Category spending breakdown (protected)
- `GET /api/analytics/trends` - Income/expense trends over time (protected)

---

## 📊 Development Status

**Project Status:** ✅ **COMPLETE** (All 5 Epics Implemented)

| Epic | Description | Stories | Status |
|------|-------------|---------|--------|
| Epic 1 | Project Foundation & Infrastructure | 5/5 | ✅ Done |
| Epic 2 | User Authentication & Access Control | 6/6 | ✅ Done |
| Epic 3 | Transaction Management & Categories | 6/6 | ✅ Done |
| Epic 4 | Financial Dashboard & Analytics | 6/6 | ✅ Done |
| Epic 5 | User Experience & Polish | 6/6 | ✅ Done |

**Total:** 29 user stories completed

View detailed sprint status: `.bmad-ephemeral/sprint-status.yaml`

---

## 🤝 Contributing

This project was developed using the **BMad Method** (BMM), an AI-powered agile development framework. All features were implemented following user stories with strict acceptance criteria.

For contribution guidelines and development workflow, see:
- `.bmad/bmm/docs/` - BMad Method documentation
- `docs/PRD.md` - Product requirements
- `docs/architecture.md` - Technical decisions

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with the [BMad Method](https://github.com/anthropics/bmad-method) for AI-assisted development
- Developed using Claude Code (Anthropic)
- Icons from Heroicons
- Charts powered by Recharts

---

## 📞 Support

For issues, questions, or feature requests:
- Check the troubleshooting section above
- Review the documentation in `docs/`
- Open an issue on GitHub

---

**Version:** 1.0.0
**Last Updated:** 2025-11-16
**Status:** Production Ready ✅

---

**Happy Budgeting! 💰📊**
