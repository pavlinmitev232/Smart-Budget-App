/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Add automatic updated_at timestamp trigger
 *
 * Creates a reusable trigger function that automatically updates the updated_at
 * column whenever a row is modified. This is applied to both users and transactions tables.
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create a reusable trigger function that updates the updated_at timestamp
  pgm.createFunction(
    'update_updated_at_column',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
      replace: true,
    },
    `
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    `
  );

  // Apply trigger to users table
  pgm.createTrigger('users', 'update_users_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });

  // Apply trigger to transactions table
  pgm.createTrigger('transactions', 'update_transactions_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

/**
 * Rollback updated_at trigger
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop triggers first
  pgm.dropTrigger('transactions', 'update_transactions_updated_at', {
    ifExists: true,
  });

  pgm.dropTrigger('users', 'update_users_updated_at', {
    ifExists: true,
  });

  // Drop the trigger function
  pgm.dropFunction('update_updated_at_column', [], {
    ifExists: true,
  });
};
