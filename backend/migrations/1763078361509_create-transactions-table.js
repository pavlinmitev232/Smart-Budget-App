/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create transactions table
 *
 * Table structure:
 * - id: Auto-incrementing primary key
 * - user_id: Foreign key to users table with cascade delete
 * - type: Transaction type (income/expense)
 * - amount: Transaction amount with precision for financial data
 * - category: Transaction category for grouping
 * - date: Transaction date
 * - description: Optional transaction notes
 * - source_vendor: Optional vendor/source information
 * - created_at: Record creation timestamp
 * - updated_at: Last modification timestamp
 *
 * Indexes:
 * - idx_user_date: Composite index for user transaction history queries
 * - idx_user_category: Composite index for category-based filtering
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create transactions table
  pgm.createTable('transactions', {
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
    type: {
      type: 'varchar(10)',
      notNull: true,
      check: "type IN ('income', 'expense')",
    },
    amount: {
      type: 'decimal(10,2)',
      notNull: true,
      check: 'amount > 0',
    },
    category: {
      type: 'varchar(50)',
      notNull: true,
    },
    date: {
      type: 'date',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    source_vendor: {
      type: 'varchar(255)',
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

  // Create composite index for user transaction history queries (most recent first)
  pgm.createIndex('transactions', ['user_id', 'date'], {
    name: 'idx_user_date',
    method: 'btree',
  });

  // Create composite index for category-based filtering per user
  pgm.createIndex('transactions', ['user_id', 'category'], {
    name: 'idx_user_category',
    method: 'btree',
  });
};

/**
 * Rollback transactions table creation
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop indexes first, then table
  pgm.dropIndex('transactions', ['user_id', 'category'], {
    name: 'idx_user_category',
  });

  pgm.dropIndex('transactions', ['user_id', 'date'], {
    name: 'idx_user_date',
  });

  pgm.dropTable('transactions');
};
