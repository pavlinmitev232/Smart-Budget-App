import { Pool } from 'pg';
import { config } from './env';

// Database connection configuration using centralized config
const poolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test connection on module load
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    console.error('Please ensure PostgreSQL is running and connection details are correct.');
  } else {
    console.log('✅ Successfully connected to PostgreSQL database');
    console.log(`   Database: ${poolConfig.database}`);
    console.log(`   Host: ${poolConfig.host}:${poolConfig.port}`);
  }
});

// Helper function to check database connectivity
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1 as connected');
    return result.rows[0].connected === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

// Export pool for use in other modules
export default pool;
