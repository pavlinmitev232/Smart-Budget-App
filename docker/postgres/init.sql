-- PostgreSQL initialization script for pg_cron
-- This script runs automatically when the database is first created

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions to the application user
GRANT USAGE ON SCHEMA cron TO smartbudget;

-- Log extension enablement
DO $$
BEGIN
  RAISE NOTICE 'pg_cron extension enabled successfully';
END $$;
