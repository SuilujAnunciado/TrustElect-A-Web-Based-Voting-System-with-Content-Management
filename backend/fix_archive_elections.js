const pool = require('./src/config/db');

async function fixArchiveElections() {
  try {
    console.log('🔧 Fixing Archive Elections Functionality...');
    
    // Step 1: Check current schema
    console.log('📊 Step 1: Checking current database schema...');
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'elections' 
      AND column_name IN ('is_archived', 'is_deleted', 'archived_at', 'archived_by', 'deleted_at', 'deleted_by')
      ORDER BY column_name
    `);
    
    console.log('Current archive columns:');
    if (schemaCheck.rows.length > 0) {
      schemaCheck.rows.forEach(row => {
        console.log(`  ✅ ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('  ❌ No archive columns found!');
    }
    
    // Step 2: Add missing columns if needed
    console.log('\\n🔨 Step 2: Adding missing columns...');
    await pool.query(`
      ALTER TABLE elections 
      ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS archived_by INTEGER NULL,
      ADD COLUMN IF NOT EXISTS deleted_by INTEGER NULL
    `);
    
    // Step 3: Add foreign key constraints
    console.log('🔗 Step 3: Adding foreign key constraints...');
    try {
      await pool.query(`
        ALTER TABLE elections 
        ADD CONSTRAINT IF NOT EXISTS fk_elections_archived_by 
        FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      
      await pool.query(`
        ALTER TABLE elections 
        ADD CONSTRAINT IF NOT EXISTS fk_elections_deleted_by 
        FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (constraintError) {
      console.log('⚠️  Foreign key constraints already exist or failed to add:', constraintError.message);
    }
    
    // Step 4: Add indexes for better performance
    console.log('📈 Step 4: Adding performance indexes...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_elections_is_archived 
        ON elections(is_archived) WHERE is_archived = TRUE
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_elections_archived_at 
        ON elections(archived_at) WHERE archived_at IS NOT NULL
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_elections_is_deleted 
        ON elections(is_deleted) WHERE is_deleted = TRUE
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_elections_deleted_at 
        ON elections(deleted_at) WHERE deleted_at IS NOT NULL
      `);
    } catch (indexError) {
      console.log('⚠️  Indexes already exist or failed to add:', indexError.message);
    }
    
    // Step 5: Update existing elections to have proper default values
    console.log('🔄 Step 5: Updating existing elections...');
    const updateResult = await pool.query(`
      UPDATE elections 
      SET 
        is_archived = COALESCE(is_archived, FALSE),
        is_deleted = COALESCE(is_deleted, FALSE),
        archived_at = COALESCE(archived_at, NULL),
        deleted_at = COALESCE(deleted_at, NULL),
        archived_by = COALESCE(archived_by, NULL),
        deleted_by = COALESCE(deleted_by, NULL)
      WHERE 
        is_archived IS NULL OR 
        is_deleted IS NULL
    `);
    
    console.log(`Updated ${updateResult.rowCount} elections with default values`);
    
    // Step 6: Test the archived elections query
    console.log('\\n🧪 Step 6: Testing archived elections query...');
    const testQuery = `
      SELECT 
        e.id,
        e.title,
        e.is_archived,
        e.archived_at,
        e.archived_by,
        u.first_name || ' ' || u.last_name as creator_name,
        archived_user.first_name || ' ' || archived_user.last_name as archived_by_name
      FROM elections e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN users archived_user ON e.archived_by = archived_user.id
      WHERE e.is_archived = TRUE AND e.is_deleted = FALSE
      ORDER BY e.archived_at DESC
      LIMIT 5
    `;
    
    const testResult = await pool.query(testQuery);
    console.log(`✅ Found ${testResult.rows.length} archived elections`);
    
    if (testResult.rows.length > 0) {
      console.log('Sample archived elections:');
      testResult.rows.forEach((election, index) => {
        console.log(`  ${index + 1}. ${election.title} (Archived: ${election.archived_at})`);
      });
    } else {
      console.log('ℹ️  No archived elections found (this is normal if none have been archived yet)');
    }
    
    // Step 7: Test creating a sample archived election
    console.log('\\n🎯 Step 7: Testing archive functionality...');
    
    // Find an election to test with
    const sampleElection = await pool.query(`
      SELECT id, title FROM elections 
      WHERE is_archived = FALSE AND is_deleted = FALSE 
      LIMIT 1
    `);
    
    if (sampleElection.rows.length > 0) {
      const electionId = sampleElection.rows[0].id;
      const electionTitle = sampleElection.rows[0].title;
      
      console.log(`Testing with election: ${electionTitle} (ID: ${electionId})`);
      
      // Archive it temporarily for testing
      await pool.query(`
        UPDATE elections 
        SET is_archived = TRUE, archived_at = NOW(), archived_by = 1
        WHERE id = $1
      `, [electionId]);
      
      console.log('✅ Election archived for testing');
      
      // Test the query again
      const archivedTestResult = await pool.query(testQuery);
      console.log(`✅ Found ${archivedTestResult.rows.length} archived elections after archiving test election`);
      
      // Restore it
      await pool.query(`
        UPDATE elections 
        SET is_archived = FALSE, archived_at = NULL, archived_by = NULL
        WHERE id = $1
      `, [electionId]);
      
      console.log('✅ Test election restored');
    } else {
      console.log('ℹ️  No elections available for testing archive functionality');
    }
    
    console.log('\\n🎉 Archive elections functionality fixed successfully!');
    console.log('\\n📋 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Try accessing the archived elections page');
    console.log('3. The functionality should now work correctly');
    
  } catch (error) {
    console.error('💥 Error fixing archive elections:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    await pool.end();
  }
}

fixArchiveElections();
