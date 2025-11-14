# Smart Budget App

A modern personal finance management application built with React, Express, and PostgreSQL.

## 📋 Overview

Smart Budget App helps users track income and expenses, categorize transactions, and visualize spending patterns through interactive dashboards. Transform messy financial data into clear, actionable insights.

## 🚀 Tech Stack

### Frontend
- **React 18+** - UI library
- **TypeScript** - Type-safe development
- **Vite 7.2** - Fast build tool with HMR
- **Tailwind CSS** - Utility-first styling (to be added)
- **React Hook Form** - Form management (to be added)
- **Recharts** - Data visualization (to be added)

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **PostgreSQL 14+** - Relational database
- **Prisma** - Type-safe ORM (to be added)
- **JWT** - Authentication (to be added)
- **bcrypt** - Password hashing (to be added)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.19+ or 22.12+ (required for Vite 7)
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)

- **PostgreSQL 14+** (will be needed in Story 1.2)
  - Check version: `psql --version`
  - Download: [postgresql.org](https://www.postgresql.org/download/)

- **npm** (comes with Node.js)
  - Check version: `npm --version`

- **Git** (for version control)
  - Check version: `git --version`

## 🛠️ Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd smart-budget-app
\`\`\`

### 2. Install Dependencies

Install root dependencies:
\`\`\`bash
npm install
\`\`\`

Install frontend dependencies:
\`\`\`bash
cd frontend
npm install
cd ..
\`\`\`

Install backend dependencies:
\`\`\`bash
cd backend
npm install
cd ..
\`\`\`

### 3. Environment Configuration (Story 1.4)

Create a \`.env\` file in the backend directory:
\`\`\`bash
cp backend/.env.example backend/.env
\`\`\`

Update the \`.env\` file with your local configuration.

## 🚦 Development

### Run Both Servers Concurrently

\`\`\`bash
npm run dev
\`\`\`

This starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Run Servers Individually

Frontend only:
\`\`\`bash
npm run dev:frontend
\`\`\`

Backend only:
\`\`\`bash
npm run dev:backend
\`\`\`

### Code Formatting

Format all code:
\`\`\`bash
npm run format
\`\`\`

Check formatting:
\`\`\`bash
npm run format:check
\`\`\`

## 📁 Project Structure

\`\`\`
smart-budget-app/
├── frontend/                # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components (route targets)
│   │   ├── contexts/        # React Context providers
│   │   ├── services/        # API client, utilities
│   │   ├── types/           # TypeScript interfaces
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Application entry point
│   ├── public/              # Static assets
│   ├── index.html           # HTML template
│   ├── vite.config.ts       # Vite configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json         # Frontend dependencies
│
├── backend/                 # Express + TypeScript
│   ├── src/
│   │   ├── features/        # Feature-based modules
│   │   │   ├── auth/        # Authentication feature
│   │   │   ├── transactions/# Transactions feature
│   │   │   └── analytics/   # Analytics feature
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Shared utilities
│   │   ├── types/           # TypeScript interfaces
│   │   └── index.ts         # Express server entry point
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json         # Backend dependencies
│
├── docs/                    # Project documentation
│   ├── PRD.md              # Product Requirements Document
│   ├── architecture.md     # Architecture decisions
│   └── epics.md            # Epic and story breakdown
│
├── .bmad/                  # BMad Method framework
├── .bmad-ephemeral/        # Story files and sprint tracking
├── .gitignore              # Git ignore rules
├── .prettierrc             # Prettier configuration
├── package.json            # Root workspace configuration
└── README.md               # This file
\`\`\`

## 🧪 Testing (To Be Added)

Testing infrastructure will be added in future stories.

## 🏗️ Build for Production (To Be Added)

Production build scripts will be added in future stories.

## 📝 Development Workflow

This project follows the **BMad Method** (BMM) for AI-powered agile development:

1. **Epic Planning** - Break down features into epics
2. **Story Creation** - Create detailed user stories
3. **Implementation** - Develop stories sequentially
4. **Review & Testing** - Code review and validation
5. **Completion** - Mark stories done and iterate

Current sprint status: `.bmad-ephemeral/sprint-status.yaml`

## 🤝 Contributing

This project is developed using AI-assisted development with the BMad Method. For contribution guidelines, please refer to the project documentation.

## 📄 License

[To be added]

## 🔗 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [BMad Method Documentation](.bmad/bmm/docs/)

---

**Version:** 1.0.0
**Last Updated:** 2025-11-13
**Status:** Story 1.1 Complete - Project Structure Initialized
