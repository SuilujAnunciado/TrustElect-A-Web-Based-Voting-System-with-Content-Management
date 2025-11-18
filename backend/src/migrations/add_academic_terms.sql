-- Create academic_terms table to manage school year + term combinations
CREATE TABLE IF NOT EXISTS academic_terms (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(25) NOT NULL,
  term VARCHAR(25) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure uniqueness regardless of casing
CREATE UNIQUE INDEX IF NOT EXISTS academic_terms_unique_idx
  ON academic_terms (LOWER(school_year), LOWER(term));

-- Seed default term if it does not exist yet
INSERT INTO academic_terms (school_year, term, is_current)
SELECT '2025-2026', 'Term 1', TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM academic_terms
  WHERE LOWER(school_year) = LOWER('2025-2026')
    AND LOWER(term) = LOWER('Term 1')
);

-- Add academic_term_id to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS academic_term_id INTEGER;

-- Backfill existing students with the default term
WITH default_term AS (
  SELECT id
  FROM academic_terms
  WHERE LOWER(school_year) = LOWER('2025-2026')
    AND LOWER(term) = LOWER('Term 1')
  LIMIT 1
)
UPDATE students
SET academic_term_id = (SELECT id FROM default_term)
WHERE academic_term_id IS NULL
  AND EXISTS (SELECT 1 FROM default_term);

-- Enforce presence of a valid academic term on each student
ALTER TABLE students
  ALTER COLUMN academic_term_id SET NOT NULL;

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
  END IF;
END;
$$;

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION academic_terms_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academic_terms_updated_at ON academic_terms;
CREATE TRIGGER trg_academic_terms_updated_at
BEFORE UPDATE ON academic_terms
FOR EACH ROW
EXECUTE FUNCTION academic_terms_update_timestamp();

