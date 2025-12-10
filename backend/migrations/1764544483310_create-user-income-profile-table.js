/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create user_income_profile table for storing user income information
 *
 * This table stores:
 * - Primary income (amount, frequency, source)
 * - Additional monthly income (side gigs, investments, etc.)
 * - Normalized monthly income (auto-calculated for easy budgeting)
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('user_income_profile', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    user_id: {
      type: 'integer',
      notNull: true,
      unique: true,
      references: 'users(id)',
      onDelete: 'CASCADE'
    },
    primary_income_amount: {
      type: 'decimal(10,2)',
      notNull: true
    },
    primary_income_frequency: {
      type: 'varchar(20)',
      notNull: true,
      check: "primary_income_frequency IN ('hourly', 'weekly', 'biweekly', 'monthly', 'annual')"
    },
    primary_income_source: {
      type: 'varchar(100)',
      notNull: false
    },
    additional_monthly_income: {
      type: 'decimal(10,2)',
      notNull: true,
      default: 0
    },
    normalized_monthly_income: {
      type: 'decimal(10,2)',
      notNull: true
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

  // Create index on user_id for faster lookups
  pgm.createIndex('user_income_profile', 'user_id');

  // Add comment
  pgm.sql(`
    COMMENT ON TABLE user_income_profile IS
    'Stores user income information for personalized AI budget recommendations. One profile per user.';
  `);
};

/**
 * Drop user_income_profile table
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('user_income_profile');
};
