-- ============================================================================
-- FIX PERMISSIONS ERROR
-- ============================================================================
-- The table exists but your app user doesn't have permissions
-- Replace 'your_app_user' with your actual database user
-- ============================================================================

-- Option 1: If you know your app's database username, use it
-- Common usernames: trustelect, postgres, app_user, etc.
-- Check your backend/.env or src/config/db.js for DB_USER

-- Grant all permissions to your app user (REPLACE 'trustelect' with your actual user)
GRANT ALL PRIVILEGES ON TABLE academic_terms TO trustelect;
GRANT USAGE, SELECT ON SEQUENCE academic_terms_id_seq TO trustelect;

-- Also grant for students table (in case it's needed)
GRANT ALL PRIVILEGES ON TABLE students TO trustelect;

-- Grant on all tables in public schema (safest option)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trustelect;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trustelect;

-- Make future tables also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL PRIVILEGES ON TABLES TO trustelect;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL PRIVILEGES ON SEQUENCES TO trustelect;

-- ============================================================================
-- ALTERNATIVE: If you don't know the username
-- ============================================================================

-- Step 1: Find out which user your app is using
-- Check your .env file or run this query while connected as that user:
-- SELECT current_user;

-- Step 2: Replace 'your_app_user' below with the result from Step 1

-- GRANT ALL PRIVILEGES ON TABLE academic_terms TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE academic_terms_id_seq TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- ============================================================================
-- VERIFY PERMISSIONS
-- ============================================================================

-- Check permissions on academic_terms table
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='academic_terms';

-- Check current database user
SELECT current_user, current_database();

-- ============================================================================
-- COMMON USERNAMES TO TRY:
-- - trustelect
-- - postgres
-- - root
-- - app
-- - your_project_name
-- ============================================================================

