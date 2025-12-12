/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  // Create notifications table
  pgm.createTable('notifications', {
    id: { type: 'serial', primaryKey: true },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'varchar(50)',
      notNull: true,
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    message: {
      type: 'text',
      notNull: true,
    },
    goal_id: {
      type: 'integer',
      references: 'goals(id)',
      onDelete: 'SET NULL',
    },
    goal_name: {
      type: 'varchar(200)',
    },
    metadata: {
      type: 'jsonb',
    },
    is_read: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes
  pgm.createIndex('notifications', 'user_id');
  pgm.createIndex('notifications', ['user_id', 'is_read']);
  pgm.createIndex('notifications', 'created_at');

  // Add comment
  pgm.sql(`
    COMMENT ON TABLE notifications IS
    'Stores user notifications for goal timeline changes and other events';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('notifications');
};
