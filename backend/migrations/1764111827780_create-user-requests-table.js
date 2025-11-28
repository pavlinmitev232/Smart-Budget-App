/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create user_requests table for tracking API usage
 *
 * Table structure:
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key to users table
 * - request_type: Type of request (e.g., 'ai_insight', 'bill_comparison')
 * - request_timestamp: When the request was made
 * - provider: AI provider used (e.g., 'gpt-5.1', 'gemini-3-pro')
 * - tokens_used: Number of tokens consumed
 * - created_at: Record creation timestamp
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create user_requests table
  pgm.createTable('user_requests', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    request_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    request_timestamp: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    provider: {
      type: 'varchar(50)',
      notNull: false,
    },
    tokens_used: {
      type: 'integer',
      notNull: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index for efficient user-specific queries ordered by time
  pgm.createIndex('user_requests', ['user_id', 'request_timestamp'], {
    name: 'idx_user_requests_user_time',
    method: 'btree',
  });

  // Create index for filtering by request type
  pgm.createIndex('user_requests', 'request_type', {
    name: 'idx_user_requests_type',
  });
};

/**
 * Rollback user_requests table creation
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop indexes first
  pgm.dropIndex('user_requests', ['user_id', 'request_timestamp'], {
    name: 'idx_user_requests_user_time',
  });

  pgm.dropIndex('user_requests', 'request_type', {
    name: 'idx_user_requests_type',
  });

  // Drop table
  pgm.dropTable('user_requests');
};
