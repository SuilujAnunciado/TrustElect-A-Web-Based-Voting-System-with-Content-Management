-- ============================================================================
-- ACADEMIC TERMS - SIMPLE SETUP (Essential commands only)
-- ============================================================================
-- Run these commands in order on your PostgreSQL database
-- ============================================================================

-- 1. Create academic_terms table
CREATE TABLE academic_terms (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(25) NOT NULL,
  term VARCHAR(25) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create unique index for school_year + term
CREATE UNIQUE INDEX academic_terms_unique_idx
  ON academic_terms (LOWER(school_year), LOWER(term));

-- 3. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION academic_terms_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger
CREATE TRIGGER academic_terms_update_timestamp_trigger
  BEFORE UPDATE ON academic_terms
  FOR EACH ROW
  EXECUTE FUNCTION academic_terms_update_timestamp();

-- 5. Add academic_term_id column to students table
ALTER TABLE students ADD COLUMN academic_term_id INTEGER;

-- 6. Insert default academic term
INSERT INTO academic_terms (school_year, term, is_current, is_active)
VALUES ('2025-2026', '1st Semester', TRUE, TRUE);

-- 7. Get the default term ID and update existing students
-- (Replace <TERM_ID> with the actual ID from step 6, usually 1)
UPDATE students 
SET academic_term_id = 1 
WHERE academic_term_id IS NULL;

-- 8. Make academic_term_id required
ALTER TABLE students ALTER COLUMN academic_term_id SET NOT NULL;

-- 9. Add foreign key constraint
ALTER TABLE students
  ADD CONSTRAINT students_academic_term_id_fkey
  FOREIGN KEY (academic_term_id)
  REFERENCES academic_terms(id)
  ON DELETE RESTRICT;

-- 10. Create index for performance
CREATE INDEX students_academic_term_id_idx ON students (academic_term_id);

-- ============================================================================
-- DONE! Verify with:
-- SELECT * FROM academic_terms;
-- SELECT id, first_name, last_name, academic_term_id FROM students LIMIT 5;
-- ============================================================================

