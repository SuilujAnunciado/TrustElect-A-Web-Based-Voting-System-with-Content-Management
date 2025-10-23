const pool = require('./src/config/db');

async function fixElectionArchiveColumns() {
  try {
    console.log('🔧 Fixing Election Archive Columns...\n');
    
    // Step 1: Check if columns exist
    console.log('📊 Step 1: Checking if archive columns exist...');
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'elections' 
      AND column_name IN ('is_archived', 'is_deleted', 'archived_at', 'deleted_at', 'archived_by', 'deleted_by', 'auto_delete_at')
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('Existing columns:', existingColumns);
    
    const requiredColumns = ['is_archived', 'is_deleted', 'archived_at', 'deleted_at', 'archived_by', 'deleted_by', 'auto_delete_at'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('🔨 Adding missing columns...');
      
      // Add missing columns
      await pool.query(`
        ALTER TABLE elections 
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMP NULL,
        ADD COLUMN IF NOT EXISTS archived_by INTEGER NULL,
        ADD COLUMN IF NOT EXISTS deleted_by INTEGER NULL
      `);
      
      console.log('✅ Columns added successfully');
    } else {
      console.log('✅ All required columns already exist');
    }
    
    // Step 2: Add foreign key constraints
    console.log('\n🔗 Step 2: Adding foreign key constraints...');
    try {
      await pool.query(`
        ALTER TABLE elections 
        ADD CONSTRAINT IF NOT EXISTS fk_elections_archived_by 
        FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key for archived_by added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Foreign key for archived_by already exists');
      } else {
        console.log('⚠️  Error adding foreign key for archived_by:', error.message);
      }
    }
    
    try {
      await pool.query(`
        ALTER TABLE elections 
        ADD CONSTRAINT IF NOT EXISTS fk_elections_deleted_by 
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key for deleted_by added');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Foreign key for deleted_by already exists');
      } else {
        console.log('⚠️  Error adding foreign key for deleted_by:', error.message);
      }
    }
    
    // Step 3: Update existing elections
    console.log('\n🔄 Step 3: Updating existing elections...');
    const updateResult = await pool.query(`
      UPDATE elections 
      SET 
        is_archived = COALESCE(is_archived, FALSE),
        is_deleted = COALESCE(is_deleted, FALSE)
      WHERE 
        is_archived IS NULL OR 
        is_deleted IS NULL
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} elections with default values`);
    
    // Step 4: Test the functionality
    console.log('\n🧪 Step 4: Testing archive functionality...');
    
    // Test archived elections query
    try {
      const archivedResult = await pool.query(`
        SELECT id, title, is_archived, is_deleted 
        FROM elections 
        WHERE is_archived = TRUE AND is_deleted = FALSE
        LIMIT 5
      `);
      console.log(`✅ Archived elections query works (${archivedResult.rows.length} found)`);
    } catch (error) {
      console.log(`❌ Archived elections query failed: ${error.message}`);
    }
    
    // Test deleted elections query
    try {
      const deletedResult = await pool.query(`
        SELECT id, title, is_archived, is_deleted 
        FROM elections 
        WHERE is_deleted = TRUE
        LIMIT 5
      `);
      console.log(`✅ Deleted elections query works (${deletedResult.rows.length} found)`);
    } catch (error) {
      console.log(`❌ Deleted elections query failed: ${error.message}`);
    }
    
    console.log('\n🎉 Election archive columns fixed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Try the archive/delete functionality again');
    console.log('3. The 400 errors should be resolved');
    
  } catch (error) {
    console.error('💥 Error fixing election archive columns:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
  } finally {
    await pool.end();
  }
}

fixElectionArchiveColumns();
