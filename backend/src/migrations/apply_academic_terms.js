/**
 * Migration script to apply academic terms schema changes
 * 
 * Run with: node src/migrations/apply_academic_terms.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration for academic terms schema changes...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_academic_terms.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    // Remove comments and split by semicolons, but preserve DO blocks
    let cleanedSql = sql
      .split('\n')
      .map(line => {
        // Remove single-line comments
        const commentIndex = line.indexOf('--');
        if (commentIndex >= 0) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .join('\n');
    
    // Split by semicolons, but be careful with DO blocks
    const statements = [];
    let current = '';
    let inDoBlock = false;
    
    for (let i = 0; i < cleanedSql.length; i++) {
      const char = cleanedSql[i];
      const nextTwo = cleanedSql.substring(i, i + 2);
      const nextThree = cleanedSql.substring(i, i + 3);
      
      if (nextTwo === 'DO' && cleanedSql.substring(i, i + 5) === 'DO $$') {
        inDoBlock = true;
        current += 'DO $$';
        i += 4;
        continue;
      }
      
      if (inDoBlock) {
        current += char;
        if (nextThree === '$$;') {
          inDoBlock = false;
          current += '$$;';
          statements.push(current.trim());
          current = '';
          i += 2;
          continue;
        }
        continue;
      }
      
      current += char;
      
      if (char === ';' && !inDoBlock) {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        current = '';
      }
    }
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;
      
      console.log(`Executing statement ${i+1}/${statements.length}...`);
      
      try {
        await client.query(statement);
        console.log(`Statement ${i+1} executed successfully`);
      } catch (stmtError) {
        // Ignore "already exists" errors for IF NOT EXISTS statements
        if (stmtError.code === '42P07' || // duplicate_table
            (stmtError.message.includes('already exists') && statement.includes('IF NOT EXISTS')) ||
            stmtError.code === '23505' || // unique_violation
            stmtError.code === '42710') { // duplicate_object
          console.log(`Statement ${i+1} skipped (already exists): ${stmtError.message}`);
        } else {
          console.warn(`Warning in statement ${i+1}: ${stmtError.message}`);
          // Continue with other statements
        }
      }
    }
    
    // Verify the table was created
    try {
      const { rows } = await client.query(`
        SELECT COUNT(*) as count 
        FROM academic_terms
      `);
      console.log(`✓ academic_terms table exists with ${rows[0].count} records`);
    } catch (verifyError) {
      console.error('✗ Verification failed: academic_terms table may not exist');
      throw verifyError;
    }
    
    // Record the migration in migrations table if it exists
    try {
      await client.query(`
        INSERT INTO migrations (name, applied_at) 
        VALUES ('academic_terms', NOW())
        ON CONFLICT (name) DO UPDATE 
        SET applied_at = NOW()
      `);
    } catch (err) {
      console.log('Migrations table not found, skipping record');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration function
if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log('Migration process finished.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration process failed:', err);
      process.exit(1);
    });
}

module.exports = applyMigration;

