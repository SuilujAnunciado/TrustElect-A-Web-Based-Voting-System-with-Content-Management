-- ============================================================================
-- ACADEMIC TERMS MANAGEMENT SYSTEM - DATABASE SETUP
-- ============================================================================
-- This script creates all necessary tables, columns, indexes, and constraints
-- for the Academic Terms Management System
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Create academic_terms table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_terms (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(25) NOT NULL,
  term VARCHAR(25) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE academic_terms IS 'Stores academic terms (school year + semester/term combinations)';
COMMENT ON COLUMN academic_terms.school_year IS 'School year in format YYYY-YYYY (e.g., 2025-2026)';
COMMENT ON COLUMN academic_terms.term IS 'Term/Semester name (e.g., 1st Semester, 2nd Semester, Summer)';
COMMENT ON COLUMN academic_terms.is_current IS 'Indicates if this is the current active term';
COMMENT ON COLUMN academic_terms.is_active IS 'Soft delete flag - false means term is deleted';

-- ----------------------------------------------------------------------------
-- STEP 2: Create unique index to prevent duplicate terms
-- ----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS academic_terms_unique_idx
  ON academic_terms (LOWER(school_year), LOWER(term));

COMMENT ON INDEX academic_terms_unique_idx IS 'Ensures uniqueness of school_year + term combination (case-insensitive)';

-- ----------------------------------------------------------------------------
-- STEP 3: Create index for performance on is_current queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS academic_terms_is_current_idx
  ON academic_terms (is_current)
  WHERE is_current = TRUE;

COMMENT ON INDEX academic_terms_is_current_idx IS 'Improves performance when querying for current term';

-- ----------------------------------------------------------------------------
-- STEP 4: Create trigger to auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION academic_terms_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS academic_terms_update_timestamp_trigger ON academic_terms;

CREATE TRIGGER academic_terms_update_timestamp_trigger
  BEFORE UPDATE ON academic_terms
  FOR EACH ROW
  EXECUTE FUNCTION academic_terms_update_timestamp();

COMMENT ON FUNCTION academic_terms_update_timestamp() IS 'Auto-updates updated_at timestamp on record modification';

-- ----------------------------------------------------------------------------
-- STEP 5: Add academic_term_id column to students table
-- ----------------------------------------------------------------------------
-- First, check if column already exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'academic_term_id'
  ) THEN
    ALTER TABLE students ADD COLUMN academic_term_id INTEGER;
    COMMENT ON COLUMN students.academic_term_id IS 'Foreign key to academic_terms table';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 6: Seed default academic term
-- ----------------------------------------------------------------------------
-- Insert default term if no terms exist
INSERT INTO academic_terms (school_year, term, is_current, is_active)
SELECT '2025-2026', '1st Semester', TRUE, TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM academic_terms
  WHERE LOWER(school_year) = LOWER('2025-2026')
    AND LOWER(term) = LOWER('1st Semester')
);

-- ----------------------------------------------------------------------------
-- STEP 7: Backfill existing students with default academic term
-- ----------------------------------------------------------------------------
-- Assign all existing students without a term to the default term
DO $$
DECLARE
  default_term_id INTEGER;
BEGIN
  -- Get the default term ID
  SELECT id INTO default_term_id
  FROM academic_terms
  WHERE LOWER(school_year) = LOWER('2025-2026')
    AND LOWER(term) = LOWER('1st Semester')
  LIMIT 1;

  -- If default term exists, update students
  IF default_term_id IS NOT NULL THEN
    UPDATE students
    SET academic_term_id = default_term_id
    WHERE academic_term_id IS NULL;
    
    RAISE NOTICE 'Backfilled % students with default academic term (ID: %)', 
      (SELECT COUNT(*) FROM students WHERE academic_term_id = default_term_id),
      default_term_id;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 8: Make academic_term_id NOT NULL (after backfilling)
-- ----------------------------------------------------------------------------
-- Only set NOT NULL after all existing students have been assigned a term
DO $$
BEGIN
  -- Check if any students still have NULL academic_term_id
  IF NOT EXISTS (
    SELECT 1 FROM students WHERE academic_term_id IS NULL
  ) THEN
    -- Safe to set NOT NULL constraint
    ALTER TABLE students 
      ALTER COLUMN academic_term_id SET NOT NULL;
    RAISE NOTICE 'Set academic_term_id as NOT NULL';
  ELSE
    RAISE NOTICE 'WARNING: Some students still have NULL academic_term_id. Fix before setting NOT NULL.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 9: Add foreign key constraint from students to academic_terms
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'students_academic_term_id_fkey'
      AND table_name = 'students'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_academic_term_id_fkey
      FOREIGN KEY (academic_term_id)
      REFERENCES academic_terms(id)
      ON DELETE RESTRICT;
    RAISE NOTICE 'Added foreign key constraint: students_academic_term_id_fkey';
  ELSE
    RAISE NOTICE 'Foreign key constraint students_academic_term_id_fkey already exists';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 10: Create index on students.academic_term_id for performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS students_academic_term_id_idx
  ON students (academic_term_id);

COMMENT ON INDEX students_academic_term_id_idx IS 'Improves performance when filtering students by academic term';

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Optional - for checking the setup)
-- ----------------------------------------------------------------------------
-- Uncomment these to verify the setup:

-- -- Check academic_terms table structure
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'academic_terms'
-- ORDER BY ordinal_position;

-- -- Check students table for academic_term_id column
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'students' AND column_name = 'academic_term_id';

-- -- Check constraints
-- SELECT 
--   constraint_name, 
--   constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name IN ('academic_terms', 'students')
-- ORDER BY table_name, constraint_type;

-- -- Check indexes
-- SELECT 
--   indexname, 
--   indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('academic_terms', 'students')
--   AND indexname LIKE '%academic%'
-- ORDER BY tablename, indexname;

-- -- Check current academic terms
-- SELECT 
--   id,
--   school_year,
--   term,
--   is_current,
--   is_active,
--   created_at
-- FROM academic_terms
-- ORDER BY created_at DESC;

-- -- Check students with academic term info
-- SELECT 
--   s.id,
--   s.first_name,
--   s.last_name,
--   s.student_number,
--   s.academic_term_id,
--   at.school_year,
--   at.term
-- FROM students s
-- LEFT JOIN academic_terms at ON s.academic_term_id = at.id
-- LIMIT 10;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- The database is now ready for Academic Terms Management System
-- 
-- Next Steps:
-- 1. Verify the setup by running the verification queries above
-- 2. Access the Academic Terms management page at /superadmin/academic-terms
-- 3. Create additional terms as needed
-- 4. Upload students - they will automatically be assigned to current term
-- ============================================================================

