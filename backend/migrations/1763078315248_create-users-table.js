/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create users table
 *
 * Table structure:
 * - id: Auto-incrementing primary key
 * - email: Unique user email for authentication
 * - password_hash: Hashed password storage
 * - created_at: Record creation timestamp
 * - updated_at: Last modification timestamp
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create users table
  pgm.createTable('users', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(255)',
      notNull: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index on email for fast lookups during authentication
  pgm.createIndex('users', 'email', {
    name: 'idx_email',
  });
};

/**
 * Rollback users table creation
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop index first, then table
  pgm.dropIndex('users', 'email', {
    name: 'idx_email',
  });

  pgm.dropTable('users');
};
