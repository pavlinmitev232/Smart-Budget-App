/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create contact_submissions table
 *
 * Table structure:
 * - id: Auto-incrementing primary key
 * - name: Contact person's name
 * - email: Contact person's email
 * - subject: Inquiry subject/category
 * - message: Contact message content
 * - ip_address: Submitter's IP address for spam tracking
 * - user_agent: Submitter's browser user agent
 * - created_at: Submission timestamp
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create contact_submissions table
  pgm.createTable('contact_submissions', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
    email: {
      type: 'varchar(255)',
      notNull: true,
    },
    subject: {
      type: 'varchar(100)',
      notNull: false, // Optional field
    },
    message: {
      type: 'text',
      notNull: true,
    },
    ip_address: {
      type: 'varchar(45)', // Supports both IPv4 and IPv6
      notNull: false,
    },
    user_agent: {
      type: 'text',
      notNull: false,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Create indexes for rate limiting queries
  pgm.createIndex('contact_submissions', 'ip_address', {
    name: 'idx_contact_ip_address',
  });

  pgm.createIndex('contact_submissions', 'email', {
    name: 'idx_contact_email',
  });

  // Create index on created_at for time-based queries
  pgm.createIndex('contact_submissions', 'created_at', {
    name: 'idx_contact_created_at',
  });
};

/**
 * Rollback contact_submissions table creation
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Drop indexes first, then table
  pgm.dropIndex('contact_submissions', 'ip_address', {
    name: 'idx_contact_ip_address',
  });

  pgm.dropIndex('contact_submissions', 'email', {
    name: 'idx_contact_email',
  });

  pgm.dropIndex('contact_submissions', 'created_at', {
    name: 'idx_contact_created_at',
  });

  pgm.dropTable('contact_submissions');
};
