import dotenv from 'dotenv';

// Load environment variables BEFORE accessing them
dotenv.config();

/**
 * Configuration interface with strong typing
 */
export interface AppConfig {
  // Server Configuration
  port: number;
  nodeEnv: string;

  // Database Configuration
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };

  // Authentication
  jwtSecret?: string;

  // Email Configuration (SMTP)
  smtp: {
    email: string;
    password: string;
  };

  // Frontend URL for email links
  frontendUrl: string;
}

/**
 * Validates that a required environment variable exists
 * @param key - The environment variable name
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws Error if required variable is missing and no default provided
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Validates and loads all configuration from environment variables
 * Fails fast with descriptive errors if required variables are missing
 */
function loadConfig(): AppConfig {
  const missingVars: string[] = [];

  // Helper to track missing required variables
  const tryGetEnvVar = (key: string, defaultValue?: string): string => {
    try {
      return getEnvVar(key, defaultValue);
    } catch (error) {
      if (!defaultValue) {
        missingVars.push(key);
      }
      return defaultValue || '';
    }
  };

  // Load server configuration
  const port = parseInt(getEnvVar('PORT', '5000'), 10);
  const nodeEnv = getEnvVar('NODE_ENV', 'development');

  // Load database configuration
  // Support both DATABASE_URL and individual DB_* variables
  const databaseUrl = tryGetEnvVar('DATABASE_URL');
  const dbHost = tryGetEnvVar('DB_HOST', 'localhost');
  const dbPort = parseInt(tryGetEnvVar('DB_PORT', '5432'), 10);
  const dbName = tryGetEnvVar('DB_NAME');
  const dbUser = tryGetEnvVar('DB_USER');
  const dbPassword = tryGetEnvVar('DB_PASSWORD');

  // Fail fast if required variables are missing
  if (missingVars.length > 0) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ CONFIGURATION ERROR: Missing Required Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following required environment variables are missing:

${missingVars.map(v => `  • ${v}`).join('\n')}

Please ensure you have a .env file in the backend directory with all
required variables. You can copy .env.example and fill in the values.

Example setup:
  1. Copy .env.example to .env
  2. Update the values with your local configuration
  3. Restart the application

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    throw new Error(errorMessage);
  }

  // Load SMTP configuration
  const smtpEmail = tryGetEnvVar('SMTP_EMAIL');
  const smtpPassword = tryGetEnvVar('SMTP_PASSWORD');
  const frontendUrl = tryGetEnvVar('FRONTEND_URL', 'http://localhost:3000');

  // Build final configuration object
  const config: AppConfig = {
    port,
    nodeEnv,
    database: {
      url: databaseUrl,
      host: dbHost,
      port: dbPort,
      name: dbName,
      user: dbUser,
      password: dbPassword,
    },
    jwtSecret: process.env.JWT_SECRET, // Optional for now
    smtp: {
      email: smtpEmail,
      password: smtpPassword,
    },
    frontendUrl,
  };

  return config;
}

/**
 * Centralized application configuration
 * Validated and loaded once at startup
 */
export const config: AppConfig = loadConfig();

/**
 * Logs configuration info (without sensitive values)
 */
export function logConfigInfo(): void {
  console.log('📋 Configuration loaded:');
  console.log(`   • Environment: ${config.nodeEnv}`);
  console.log(`   • Server Port: ${config.port}`);
  console.log(`   • Database: ${config.database.name} @ ${config.database.host}:${config.database.port}`);
  console.log(`   • JWT Secret: ${config.jwtSecret ? '✓ Set' : '✗ Not set (will be required for auth)'}`);
  console.log(`   • SMTP Email: ${config.smtp.email ? '✓ Set' : '✗ Not set'}`);
  console.log(`   • Frontend URL: ${config.frontendUrl}`);
}
