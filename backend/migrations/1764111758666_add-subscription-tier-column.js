/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Add subscription_tier column to users table
 *
 * Adds subscription tier support with three levels: free, basic, pro
 * - subscription_tier: VARCHAR(20), DEFAULT 'free', CHECK constraint for valid values
 * - All existing users will default to 'free' tier
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Add subscription_tier column to users table
  pgm.addColumn('users', {
    subscription_tier: {
      type: 'varchar(20)',
      notNull: true,
      default: 'free',
    },
  });

  // Add CHECK constraint to enforce valid tier values
  pgm.addConstraint('users', 'users_subscription_tier_check', {
    check: "subscription_tier IN ('free', 'basic', 'pro')",
  });

  // Create index on subscription_tier for efficient filtering
  pgm.createIndex('users', 'subscription_tier', {
    name: 'idx_users_subscription_tier',
  });
};

/**
 * Rollback subscription_tier column addition
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop index first
  pgm.dropIndex('users', 'subscription_tier', {
    name: 'idx_users_subscription_tier',
  });

  // Drop constraint
  pgm.dropConstraint('users', 'users_subscription_tier_check');

  // Drop column
  pgm.dropColumn('users', 'subscription_tier');
};
