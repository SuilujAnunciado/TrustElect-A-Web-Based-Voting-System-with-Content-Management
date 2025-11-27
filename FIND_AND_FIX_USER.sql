-- ============================================================================
-- FIND YOUR DATABASE USER AND FIX PERMISSIONS
-- ============================================================================

-- Step 1: Check who you're currently connected as
SELECT current_user, current_database();

-- Step 2: List all database users/roles
SELECT rolname FROM pg_roles ORDER BY rolname;

-- Step 3: Check who owns the academic_terms table
SELECT tableowner FROM pg_tables WHERE tablename = 'academic_terms';

-- ============================================================================
-- SOLUTION 1: If you're connected as 'postgres' (most common)
-- ============================================================================

-- Grant permissions to the postgres user (owner of everything)
GRANT ALL PRIVILEGES ON TABLE academic_terms TO postgres;
GRANT USAGE, SELECT ON SEQUENCE academic_terms_id_seq TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================================================
-- SOLUTION 2: Create the 'trustelect' user if it doesn't exist
-- ============================================================================

-- Create the user with password
CREATE USER trustelect WITH PASSWORD 'your_password_here';

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE trustelect TO trustelect;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trustelect;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trustelect;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO trustelect;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO trustelect;

-- Make trustelect owner of tables
ALTER TABLE academic_terms OWNER TO trustelect;
ALTER TABLE students OWNER TO trustelect;

-- ============================================================================
-- SOLUTION 3: Change table owner to current user
-- ============================================================================

-- If you're connected as 'postgres', make postgres the owner
ALTER TABLE academic_terms OWNER TO postgres;
ALTER SEQUENCE academic_terms_id_seq OWNER TO postgres;

-- ============================================================================
-- QUICK CHECK: What does your .env file say?
-- ============================================================================

-- Your backend/.env should have something like:
-- DB_USER=postgres (or trustelect, or root, etc.)
-- DB_PASSWORD=your_password
-- DB_NAME=trustelect (or your database name)
-- DB_HOST=localhost
-- DB_PORT=5432

-- The DB_USER in .env MUST match a role that exists in PostgreSQL!

-- ============================================================================
-- MOST LIKELY FIX (if you're using postgres user):
-- ============================================================================

-- Just change the owner to postgres (the user you're connected as)
ALTER TABLE academic_terms OWNER TO postgres;
ALTER SEQUENCE academic_terms_id_seq OWNER TO postgres;

-- Verify
SELECT tableowner FROM pg_tables WHERE tablename = 'academic_terms';

-- ============================================================================

