import pool from '../../config/database';

/**
 * Create tables for timeline projections and notifications
 * Run this once to set up the database schema
 */
export async function setupTimelineTables(): Promise<void> {
  console.log('Setting up timeline tables...');

  // Create notifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
      goal_name VARCHAR(255),
      metadata JSONB,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Create index on user_id and is_read for efficient queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
    ON notifications (user_id, is_read)
    WHERE is_read = false
  `);

  // Create goal_timeline_snapshots table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS goal_timeline_snapshots (
      id SERIAL PRIMARY KEY,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      projected_completion DATE,
      months_to_goal INTEGER,
      available_for_savings DECIMAL(12, 2),
      snapshot_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(goal_id, snapshot_date)
    )
  `);

  // Create index on goal_id for efficient lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_timeline_snapshots_goal
    ON goal_timeline_snapshots (goal_id, snapshot_date DESC)
  `);

  console.log('✅ Timeline tables created successfully');
}

/**
 * Drop timeline tables (for testing/cleanup)
 */
export async function dropTimelineTables(): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS goal_timeline_snapshots CASCADE');
  await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
  console.log('✅ Timeline tables dropped');
}

// Run if executed directly
if (require.main === module) {
  setupTimelineTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to setup tables:', err);
      process.exit(1);
    });
}
