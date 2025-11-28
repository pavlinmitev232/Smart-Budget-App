/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create password_reset_tokens table
 *
 * Table structure:
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key to users table (UNIQUE - one token per user)
 * - token: JWT reset token
 * - expires_at: Token expiration timestamp
 * - created_at: Token creation timestamp
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create password_reset_tokens table
  pgm.createTable('password_reset_tokens', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    user_id: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    token: {
      type: 'varchar(500)',
      notNull: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index on token for fast lookups during password reset
  pgm.createIndex('password_reset_tokens', 'token', {
    name: 'idx_reset_tokens_token',
  });
};

/**
 * Rollback password_reset_tokens table creation
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop index first, then table
  pgm.dropIndex('password_reset_tokens', 'token', {
    name: 'idx_reset_tokens_token',
  });

  pgm.dropTable('password_reset_tokens');
};
