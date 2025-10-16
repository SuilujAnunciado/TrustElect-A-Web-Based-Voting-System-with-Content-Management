-- Add archive and delete functionality fields to elections table
-- This migration adds soft delete and archive capabilities

-- Add new columns for archive/delete functionality
ALTER TABLE elections 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN archived_at TIMESTAMP NULL,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN auto_delete_at TIMESTAMP NULL,
ADD COLUMN archived_by INTEGER NULL,
ADD COLUMN deleted_by INTEGER NULL;

-- Add foreign key constraints for archived_by and deleted_by
ALTER TABLE elections 
ADD CONSTRAINT fk_elections_archived_by 
FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE elections 
ADD CONSTRAINT fk_elections_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX idx_elections_is_archived ON elections(is_archived) WHERE is_archived = TRUE;
CREATE INDEX idx_elections_is_deleted ON elections(is_deleted) WHERE is_deleted = TRUE;
CREATE INDEX idx_elections_archived_at ON elections(archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_elections_deleted_at ON elections(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_elections_auto_delete_at ON elections(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- Add check constraints to ensure data integrity
ALTER TABLE elections 
ADD CONSTRAINT chk_elections_archive_delete 
CHECK (
  (is_archived = FALSE AND archived_at IS NULL AND archived_by IS NULL) OR
  (is_archived = TRUE AND archived_at IS NOT NULL AND archived_by IS NOT NULL)
);

ALTER TABLE elections 
ADD CONSTRAINT chk_elections_delete_soft 
CHECK (
  (is_deleted = FALSE AND deleted_at IS NULL AND deleted_by IS NULL) OR
  (is_deleted = TRUE AND deleted_at IS NOT NULL AND deleted_by IS NOT NULL)
);

-- Add constraint to prevent both archive and delete being true
ALTER TABLE elections 
ADD CONSTRAINT chk_elections_not_both_archived_deleted 
CHECK (NOT (is_archived = TRUE AND is_deleted = TRUE));

-- Update existing elections to have proper default values
UPDATE elections 
SET 
  is_archived = FALSE,
  is_deleted = FALSE,
  archived_at = NULL,
  deleted_at = NULL,
  auto_delete_at = NULL,
  archived_by = NULL,
  deleted_by = NULL
WHERE 
  is_archived IS NULL OR 
  is_deleted IS NULL OR 
  archived_at IS NULL OR 
  deleted_at IS NULL OR 
  auto_delete_at IS NULL OR 
  archived_by IS NULL OR 
  deleted_by IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN elections.is_archived IS 'Indicates if the election is archived (soft archive)';
COMMENT ON COLUMN elections.is_deleted IS 'Indicates if the election is soft deleted';
COMMENT ON COLUMN elections.archived_at IS 'Timestamp when the election was archived';
COMMENT ON COLUMN elections.deleted_at IS 'Timestamp when the election was soft deleted';
COMMENT ON COLUMN elections.auto_delete_at IS 'Timestamp when the election should be permanently deleted';
COMMENT ON COLUMN elections.archived_by IS 'User ID who archived the election';
COMMENT ON COLUMN elections.deleted_by IS 'User ID who soft deleted the election';
