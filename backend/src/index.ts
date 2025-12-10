import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config, logConfigInfo } from './config/env';
import './config/database'; // Initialize database connection (port 54321)
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import contactRouter from './routes/contact';
import aiRouter from './routes/ai';
import alertsRouter from './routes/alerts';
import categoriesRouter from './features/categories/categories.routes';
import transactionsRouter from './features/transactions/transactions.routes';
import analyticsRouter from './features/analytics/analytics.routes';
import subscriptionRouter from './features/subscriptions/subscription.routes';
import incomeRouter from './features/income/income.routes';
import goalsRouter from './features/goals/goals.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';

// Log configuration info on startup (without sensitive values)
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 Smart Budget App - Backend Server Starting');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logConfigInfo();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const app = express();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MIDDLEWARE STACK (Order is important!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. Request logging - Log all incoming requests
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// 2. CORS - Enable cross-origin requests from frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies/auth headers
  })
);

// 3. JSON body parser - Parse JSON request bodies
app.use(express.json());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ROUTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Health check and API routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/ai', aiRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use(subscriptionRouter);
app.use(incomeRouter);
app.use('/api/goals', goalsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, {
    message: 'Smart Budget App API Server',
    environment: config.nodeEnv,
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      register: '/api/auth/register',
      contact: '/api/contact',
      categories: '/api/categories',
      transactions: '/api/transactions',
      analytics: '/api/analytics',
    },
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ERROR HANDLING (Must be last!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 404 handler - Catch all undefined routes
app.use(notFoundHandler);

// Global error handler - Handle all errors
app.use(errorHandler);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// START SERVER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.listen(config.port, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${config.port}`);
  console.log(`   Environment: ${config.nodeEnv}`);
  console.log(`   Ready to accept requests!\n`);
});
