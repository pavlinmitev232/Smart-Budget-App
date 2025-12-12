/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * Create bill_comparisons and bill_images tables for AI bill comparison feature
 *
 * Tables:
 * - bill_comparisons: Groups of 2 images for comparison
 * - bill_images: Individual uploaded bill/receipt images
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Create bill_comparisons table first (parent)
  pgm.createTable('bill_comparisons', {
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
    title: {
      type: 'varchar(255)',
      notNull: false
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pending',
      check: "status IN ('pending', 'processing', 'completed', 'failed')"
    },
    result_summary: {
      type: 'text',
      notNull: false
    },
    result_data: {
      type: 'jsonb',
      notNull: false
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    },
    completed_at: {
      type: 'timestamp',
      notNull: false
    }
  });

  // Create bill_images table (child)
  pgm.createTable('bill_images', {
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
    comparison_id: {
      type: 'integer',
      notNull: false,
      references: 'bill_comparisons(id)',
      onDelete: 'CASCADE'
    },
    image_data: {
      type: 'text',
      notNull: true
    },
    file_name: {
      type: 'varchar(255)',
      notNull: true
    },
    file_size: {
      type: 'integer',
      notNull: true
    },
    mime_type: {
      type: 'varchar(50)',
      notNull: true
    },
    image_order: {
      type: 'smallint',
      notNull: false,
      check: 'image_order IN (1, 2)'
    },
    uploaded_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    }
  });

  // Create indexes
  pgm.createIndex('bill_comparisons', 'user_id', { name: 'idx_bill_comparisons_user' });
  pgm.createIndex('bill_comparisons', 'status', { name: 'idx_bill_comparisons_status' });
  pgm.createIndex('bill_comparisons', 'created_at', { name: 'idx_bill_comparisons_created' });
  pgm.createIndex('bill_images', 'user_id', { name: 'idx_bill_images_user' });
  pgm.createIndex('bill_images', 'comparison_id', { name: 'idx_bill_images_comparison' });

  // Add comments
  pgm.sql(`
    COMMENT ON TABLE bill_comparisons IS
    'Stores bill comparison sessions - each comparison contains 2 images to be analyzed by AI';

    COMMENT ON TABLE bill_images IS
    'Stores uploaded bill/receipt images as base64 for AI comparison';

    COMMENT ON COLUMN bill_images.image_data IS
    'Base64-encoded image data (MVP approach - use S3 for production)';

    COMMENT ON COLUMN bill_images.image_order IS
    '1 = first/old bill, 2 = second/new bill for comparison';
  `);
};

/**
 * Drop bill comparison tables
 *
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('bill_images');
  pgm.dropTable('bill_comparisons');
};
