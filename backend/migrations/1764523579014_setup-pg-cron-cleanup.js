/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Setup pg_cron extension and schedule automatic cleanup of old user_requests
 *
 * This migration:
 * 1. Enables the pg_cron PostgreSQL extension (requires superuser privileges)
 * 2. Creates a cleanup function to delete user_requests older than 30 days
 * 3. Schedules the function to run daily at 2:00 AM
 *
 * Requirements:
 * - PostgreSQL 10+ with pg_cron extension installed
 * - Superuser privileges to enable extension
 *
 * The pg_cron extension allows scheduling jobs directly in PostgreSQL,
 * ensuring the cleanup runs reliably even if the application server restarts.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // 1. Enable pg_cron extension
  // Note: This requires superuser privileges
  // If you don't have superuser access, ask your DBA to run:
  // CREATE EXTENSION IF NOT EXISTS pg_cron;
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  `);

  // 2. Create the cleanup function
  pgm.sql(`
    CREATE OR REPLACE FUNCTION cleanup_old_user_requests()
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    DECLARE
      deleted_count INTEGER;
    BEGIN
      -- Delete user_requests older than 30 days
      DELETE FROM user_requests
      WHERE created_at < NOW() - INTERVAL '30 days';

      -- Get count of deleted rows
      GET DIAGNOSTICS deleted_count = ROW_COUNT;

      -- Log the cleanup (this appears in PostgreSQL logs)
      RAISE NOTICE 'Quota cleanup completed: % old user_requests deleted', deleted_count;
    END;
    $$;
  `);

  // 3. Schedule the cleanup job to run daily at 2:00 AM
  // Cron format: 'minute hour day month weekday'
  // '0 2 * * *' = Every day at 2:00 AM
  pgm.sql(`
    SELECT cron.schedule(
      'cleanup-old-user-requests',  -- Job name (must be unique)
      '0 2 * * *',                    -- Cron schedule (2:00 AM daily)
      $$SELECT cleanup_old_user_requests();$$  -- SQL to execute
    );
  `);

  // 4. Add a comment explaining the scheduled job
  pgm.sql(`
    COMMENT ON FUNCTION cleanup_old_user_requests() IS
    'Deletes user_requests records older than 30 days. Scheduled to run daily at 2:00 AM via pg_cron.';
  `);
};

/**
 * Rollback pg_cron setup
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // 1. Unschedule the cron job
  // Use unschedule() with the job name
  pgm.sql(`
    SELECT cron.unschedule('cleanup-old-user-requests');
  `);

  // 2. Drop the cleanup function
  pgm.sql(`
    DROP FUNCTION IF EXISTS cleanup_old_user_requests();
  `);

  // 3. Drop pg_cron extension
  // WARNING: This will remove ALL scheduled jobs in the database
  // Only uncomment if you're sure no other jobs exist
  // pgm.sql(`
  //   DROP EXTENSION IF EXISTS pg_cron;
  // `);
};
