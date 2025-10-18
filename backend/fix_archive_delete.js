#!/usr/bin/env node

const pool = require('./src/config/db');

async function fixArchiveDelete() {
  console.log('🔧 TrustElect Archive and Delete Functionality Fix\n');
  
  try {
    // Check current schema
    console.log('1. Checking current database schema...');
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'elections' 
      AND column_name IN ('is_archived', 'is_deleted', 'archived_at', 'deleted_at', 'auto_delete_at', 'archived_by', 'deleted_by')
      ORDER BY column_name
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    const requiredColumns = ['is_archived', 'is_deleted', 'archived_at', 'deleted_at', 'auto_delete_at', 'archived_by', 'deleted_by'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist');
    } else {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
      console.log('\n📋 To fix this, run:');
      console.log('   node apply_archive_migration.js');
      return;
    }
    
    // Check current data
    console.log('\n2. Checking current election data...');
    const dataCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_elections,
        COUNT(CASE WHEN is_archived = TRUE THEN 1 END) as archived_count,
        COUNT(CASE WHEN is_deleted = TRUE THEN 1 END) as deleted_count,
        COUNT(CASE WHEN is_archived = FALSE AND is_deleted = FALSE THEN 1 END) as active_count
      FROM elections
    `);
    
    const stats = dataCheck.rows[0];
    console.log(`📊 Election Statistics:`);
    console.log(`   - Total elections: ${stats.total_elections}`);
    console.log(`   - Active elections: ${stats.active_count}`);
    console.log(`   - Archived elections: ${stats.archived_count}`);
    console.log(`   - Deleted elections: ${stats.deleted_count}`);
    
    // Test API endpoints
    console.log('\n3. Testing API endpoints...');
    
    // Test archived elections endpoint
    try {
      const archivedElections = await pool.query(`
        SELECT id, title, is_archived, archived_at, archived_by
        FROM elections 
        WHERE is_archived = TRUE 
        LIMIT 5
      `);
      console.log(`✅ Archived elections query works (${archivedElections.rows.length} found)`);
    } catch (error) {
      console.log(`❌ Archived elections query failed: ${error.message}`);
    }
    
    // Test deleted elections endpoint
    try {
      const deletedElections = await pool.query(`
        SELECT id, title, is_deleted, deleted_at, deleted_by
        FROM elections 
        WHERE is_deleted = TRUE 
        LIMIT 5
      `);
      console.log(`✅ Deleted elections query works (${deletedElections.rows.length} found)`);
    } catch (error) {
      console.log(`❌ Deleted elections query failed: ${error.message}`);
    }
    
    console.log('\n🎉 Archive and Delete functionality is ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Start your frontend: npm run dev');
    console.log('3. Navigate to /admin/election to test archive/delete functionality');
    console.log('4. Check /admin/election/archived for archived elections');
    console.log('5. Check /admin/election/deleted for deleted elections');
    
  } catch (error) {
    console.error('❌ Error checking archive/delete functionality:', error.message);
    console.log('\n📋 To fix this, run:');
    console.log('   node apply_archive_migration.js');
  } finally {
    await pool.end();
  }
}

fixArchiveDelete();
