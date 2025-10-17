-- Ensure archive columns exist in elections table
ALTER TABLE elections 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS archived_by INTEGER NULL,
ADD COLUMN IF NOT EXISTS deleted_by INTEGER NULL;

-- Update existing elections to have proper default values
UPDATE elections 
SET 
  is_archived = COALESCE(is_archived, FALSE),
  is_deleted = COALESCE(is_deleted, FALSE)
WHERE 
  is_archived IS NULL OR 
  is_deleted IS NULL;

-- Test query
SELECT COUNT(*) as total_elections FROM elections;
SELECT COUNT(*) as archived_elections FROM elections WHERE is_archived = TRUE;
