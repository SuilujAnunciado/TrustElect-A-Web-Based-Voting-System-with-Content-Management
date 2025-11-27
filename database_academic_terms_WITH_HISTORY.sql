-- ============================================================================
-- ACADEMIC TERMS SETUP WITH PAST RECORDS
-- ============================================================================
-- This includes sample past semesters for historical data
-- ============================================================================

-- 1. Create academic_terms table
CREATE TABLE IF NOT EXISTS academic_terms (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(25) NOT NULL,
  term VARCHAR(25) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS academic_terms_unique_idx
  ON academic_terms (LOWER(school_year), LOWER(term));

-- 3. Create trigger function
CREATE OR REPLACE FUNCTION academic_terms_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
DROP TRIGGER IF EXISTS academic_terms_update_timestamp_trigger ON academic_terms;
CREATE TRIGGER academic_terms_update_timestamp_trigger
  BEFORE UPDATE ON academic_terms
  FOR EACH ROW
  EXECUTE FUNCTION academic_terms_update_timestamp();

-- 5. Add academic_term_id to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_term_id INTEGER;

-- 6. Insert PAST and CURRENT academic terms
-- Delete existing terms first to avoid duplicates
DELETE FROM academic_terms;

-- Insert past semesters (2022-2023)
INSERT INTO academic_terms (school_year, term, is_current, is_active, created_at)
VALUES 
  ('2022-2023', '1st Semester', FALSE, TRUE, '2022-08-01 00:00:00+08'),
  ('2022-2023', '2nd Semester', FALSE, TRUE, '2023-01-01 00:00:00+08');

-- Insert past semesters (2023-2024)
INSERT INTO academic_terms (school_year, term, is_current, is_active, created_at)
VALUES 
  ('2023-2024', '1st Semester', FALSE, TRUE, '2023-08-01 00:00:00+08'),
  ('2023-2024', '2nd Semester', FALSE, TRUE, '2024-01-01 00:00:00+08');

-- Insert past semesters (2024-2025)
INSERT INTO academic_terms (school_year, term, is_current, is_active, created_at)
VALUES 
  ('2024-2025', '1st Semester', FALSE, TRUE, '2024-08-01 00:00:00+08'),
  ('2024-2025', '2nd Semester', FALSE, TRUE, '2025-01-01 00:00:00+08');

-- Insert CURRENT semester (2025-2026)
INSERT INTO academic_terms (school_year, term, is_current, is_active, created_at)
VALUES 
  ('2025-2026', '1st Semester', TRUE, TRUE, '2025-08-01 00:00:00+08');

-- 7. Assign existing students to current term
UPDATE students 
SET academic_term_id = (
  SELECT id FROM academic_terms 
  WHERE is_current = TRUE 
  LIMIT 1
)
WHERE academic_term_id IS NULL;

-- 8. Make academic_term_id required
ALTER TABLE students ALTER COLUMN academic_term_id SET NOT NULL;

-- 9. Add foreign key
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
  END IF;
END $$;

-- 10. Create index
CREATE INDEX IF NOT EXISTS students_academic_term_id_idx ON students (academic_term_id);

-- ============================================================================
-- VERIFY THE SETUP
-- ============================================================================
SELECT 
  id,
  school_year,
  term,
  is_current,
  CASE WHEN is_current THEN '✓ CURRENT' ELSE '' END as status,
  created_at
FROM academic_terms
ORDER BY created_at DESC;

-- Check student distribution
SELECT 
  at.school_year,
  at.term,
  COUNT(s.id) as student_count
FROM academic_terms at
LEFT JOIN students s ON s.academic_term_id = at.id AND s.is_active = TRUE
GROUP BY at.id, at.school_year, at.term, at.created_at
ORDER BY at.created_at DESC;

-- ============================================================================
-- DONE! You now have:
-- - 7 academic terms (6 past + 1 current)
-- - All existing students assigned to current term
-- - Ready to use dropdown in Student Management page
-- ============================================================================

