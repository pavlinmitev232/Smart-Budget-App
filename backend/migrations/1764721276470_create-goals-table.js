/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create goals table for financial goal tracking
 *
 * This table stores user savings goals with:
 * - Goal details (name, type, target amount, deadline)
 * - Progress tracking (current amount, status)
 * - Priority and categorization
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('goals', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    name: {
      type: 'varchar(200)',
      notNull: true
    },
    goal_type: {
      type: 'varchar(50)',
      notNull: true,
      default: 'savings',
      check: "goal_type IN ('savings', 'purchase', 'debt_payoff')"
    },
    target_amount: {
      type: 'decimal(10,2)',
      notNull: true
    },
    current_amount: {
      type: 'decimal(10,2)',
      notNull: true,
      default: 0
    },
    deadline: {
      type: 'date',
      notNull: false
    },
    priority: {
      type: 'varchar(20)',
      notNull: true,
      default: 'medium',
      check: "priority IN ('high', 'medium', 'low')"
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'active',
      check: "status IN ('active', 'completed', 'paused', 'archived')"
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Create indexes for performance
  pgm.createIndex('goals', 'user_id', { name: 'idx_goals_user' });
  pgm.createIndex('goals', 'status', { name: 'idx_goals_status' });
  pgm.createIndex('goals', ['user_id', 'status'], { name: 'idx_goals_user_status' });

  // Add comment
  pgm.sql(`
    COMMENT ON TABLE goals IS
    'Stores user financial goals for savings, purchases, and debt payoff tracking';
  `);

  // Add updated_at trigger
  pgm.sql(`
    CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * Drop goals table
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('goals');
};
