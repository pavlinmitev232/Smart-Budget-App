/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createTable('user_alerts', {
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
    alert_type: {
      type: 'varchar(50)',
      notNull: true,
      comment: 'Type of alert: overspending_90, overspending_100, negative_balance',
    },
    severity: {
      type: 'varchar(20)',
      notNull: true,
      comment: 'Severity: warning, critical',
    },
    message: {
      type: 'text',
      notNull: true,
      comment: 'Human-readable alert message',
    },
    ai_suggestion: {
      type: 'text',
      comment: 'AI-generated recommendation',
    },
    is_read: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    dismissed_at: {
      type: 'timestamp',
      comment: 'Timestamp when alert was dismissed',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create index on user_id for faster queries
  pgm.createIndex('user_alerts', 'user_id');

  // Create index on created_at for sorting
  pgm.createIndex('user_alerts', 'created_at');

  // Create composite index for unread alerts
  pgm.createIndex('user_alerts', ['user_id', 'is_read', 'dismissed_at']);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('user_alerts');
};
