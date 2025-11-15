import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config, logConfigInfo } from './config/env';
import './config/database'; // Initialize database connection (port 54321)
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import categoriesRouter from './features/categories/categories.routes';
import transactionsRouter from './features/transactions/transactions.routes';
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
app.use(
  cors({
    origin: 'http://localhost:3000', // Frontend origin
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
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  sendSuccess(res, {
    message: 'Smart Budget App API Server',
    environment: config.nodeEnv,
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      register: '/api/auth/register',
      categories: '/api/categories',
      transactions: '/api/transactions',
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
