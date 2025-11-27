-- ============================================================================
-- RUN THIS TO FIX THE ERROR
-- ============================================================================
-- Copy and paste these commands into your PostgreSQL database
-- Or use: psql -U your_user -d your_database -f FIX_DATABASE_ERROR.sql
-- ============================================================================

-- Step 1: Create academic_terms table
CREATE TABLE IF NOT EXISTS academic_terms (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(25) NOT NULL,
  term VARCHAR(25) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS academic_terms_unique_idx
  ON academic_terms (LOWER(school_year), LOWER(term));

-- Step 3: Create update trigger function
CREATE OR REPLACE FUNCTION academic_terms_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger
DROP TRIGGER IF EXISTS academic_terms_update_timestamp_trigger ON academic_terms;
CREATE TRIGGER academic_terms_update_timestamp_trigger
  BEFORE UPDATE ON academic_terms
  FOR EACH ROW
  EXECUTE FUNCTION academic_terms_update_timestamp();

-- Step 5: Add academic_term_id column to students (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'academic_term_id'
  ) THEN
    ALTER TABLE students ADD COLUMN academic_term_id INTEGER;
  END IF;
END $$;

-- Step 6: Insert default academic terms with past records
INSERT INTO academic_terms (school_year, term, is_current, is_active, created_at)
VALUES 
  ('2022-2023', '1st Semester', FALSE, TRUE, '2022-08-01 00:00:00+08'),
  ('2022-2023', '2nd Semester', FALSE, TRUE, '2023-01-01 00:00:00+08'),
  ('2023-2024', '1st Semester', FALSE, TRUE, '2023-08-01 00:00:00+08'),
  ('2023-2024', '2nd Semester', FALSE, TRUE, '2024-01-01 00:00:00+08'),
  ('2024-2025', '1st Semester', FALSE, TRUE, '2024-08-01 00:00:00+08'),
  ('2024-2025', '2nd Semester', FALSE, TRUE, '2025-01-01 00:00:00+08'),
  ('2025-2026', '1st Semester', TRUE, TRUE, '2025-08-01 00:00:00+08')
ON CONFLICT (LOWER(school_year), LOWER(term)) DO NOTHING;

-- Step 7: Assign all existing students to current term
UPDATE students 
SET academic_term_id = (
  SELECT id FROM academic_terms WHERE is_current = TRUE LIMIT 1
)
WHERE academic_term_id IS NULL;

-- Step 8: Make academic_term_id NOT NULL (only if all students have values)
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM students WHERE academic_term_id IS NULL;
  
  IF null_count = 0 THEN
    ALTER TABLE students ALTER COLUMN academic_term_id SET NOT NULL;
    RAISE NOTICE 'Set academic_term_id as NOT NULL';
  ELSE
    RAISE NOTICE 'Cannot set NOT NULL: % students still have NULL academic_term_id', null_count;
  END IF;
END $$;

-- Step 9: Add foreign key constraint (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'students_academic_term_id_fkey'
  ) THEN
    ALTER TABLE students
      ADD CONSTRAINT students_academic_term_id_fkey
      FOREIGN KEY (academic_term_id)
      REFERENCES academic_terms(id)
      ON DELETE RESTRICT;
    RAISE NOTICE 'Added foreign key constraint';
  END IF;
END $$;

-- Step 10: Create index for performance
CREATE INDEX IF NOT EXISTS students_academic_term_id_idx 
  ON students (academic_term_id);

-- ============================================================================
-- VERIFICATION - Run these to check if it worked
-- ============================================================================

-- Check academic terms were created
SELECT 
  id,
  school_year,
  term,
  is_current,
  CASE WHEN is_current THEN '✓ CURRENT' ELSE '' END as status
FROM academic_terms
ORDER BY created_at DESC;

-- Check students have academic_term_id
SELECT 
  COUNT(*) as total_students,
  COUNT(academic_term_id) as with_term,
  COUNT(*) - COUNT(academic_term_id) as without_term
FROM students;

-- Check student distribution by term
SELECT 
  at.school_year || ' - ' || at.term as term,
  COUNT(s.id) as student_count
FROM academic_terms at
LEFT JOIN students s ON s.academic_term_id = at.id AND s.is_active = TRUE
GROUP BY at.id, at.school_year, at.term, at.created_at
ORDER BY at.created_at DESC;

-- ============================================================================
-- If successful, you should see:
-- ✅ 7 academic terms created
-- ✅ All students have academic_term_id
-- ✅ Students distributed across terms
-- ============================================================================

