# Election Archive/Delete System Update

## Overview
Updated the election archive/delete system to match the admin management system for consistency and reliability.

## Key Changes Made

### 1. Database Schema Changes
- **Added `is_active` column** to elections table
- **Updated logic** to use `is_active` and `is_deleted` columns (like admin system)
- **Removed dependency** on `is_archived` column

### 2. New Archive/Delete Logic
- **Archive**: `is_active = FALSE`, `is_deleted = FALSE`
- **Delete**: `is_active = FALSE`, `is_deleted = TRUE`
- **Restore**: `is_active = TRUE` (clears both archive and delete)
- **Permanent Delete**: Physically removes from database

### 3. Backend Model Updates (`backend/src/models/electionModel.js`)
- Updated `archiveElection()` function
- Updated `restoreArchivedElection()` function
- Updated `softDeleteElection()` function
- Updated `restoreDeletedElection()` function
- Updated `getArchivedElections()` function
- Updated `getDeletedElections()` function
- Updated `getAllElections()` function
- Updated `getAllElectionsWithCreator()` function

### 4. Frontend Updates
- **Super Admin Pages**:
  - `frontend/src/app/superadmin/election/archived/page.jsx`
  - `frontend/src/app/superadmin/election/deleted/page.jsx`
- **Admin Pages**:
  - `frontend/src/app/admin/election/archived/page.jsx`
  - `frontend/src/app/admin/election/deleted/page.jsx`

### 5. Frontend Changes
- Changed from calling `/elections/archived` and `/elections/deleted` endpoints
- Now calls `/elections` endpoint and filters on frontend (like admin system)
- Filters for archived: `is_active === false && is_deleted === false`
- Filters for deleted: `is_deleted === true`

## Database Migration Required

Run the migration script to update your database:

```sql
-- Run this SQL script in your database
\i backend/migrate_election_archive_system.sql
```

## How It Works Now (Same as Admin System)

### Archive Process:
1. User clicks "Archive" button on any election
2. Election is moved to archived folder (`is_active = FALSE`, `is_deleted = FALSE`)
3. Shows who archived it and when
4. Can be restored from archive folder

### Delete Process:
1. User clicks "Delete" button on any election
2. Election is moved to deleted folder (`is_active = FALSE`, `is_deleted = TRUE`)
3. Shows who deleted it and when
4. Can be restored from deleted folder
5. Can be permanently deleted from deleted folder

### Restore Process:
1. User clicks "Restore" button in archive or delete folder
2. Election is restored to active state (`is_active = TRUE`)
3. Clears archive/delete timestamps and user info

## Benefits of This Approach

1. **Consistency**: Same logic as admin management system
2. **Reliability**: Simpler, more robust implementation
3. **Maintainability**: Easier to understand and maintain
4. **Performance**: Better database queries and indexing
5. **User Experience**: Consistent behavior across the application

## Files Modified

### Backend:
- `backend/src/models/electionModel.js` - Updated all archive/delete functions
- `backend/migrate_election_archive_system.sql` - Database migration script

### Frontend:
- `frontend/src/app/superadmin/election/archived/page.jsx`
- `frontend/src/app/superadmin/election/deleted/page.jsx`
- `frontend/src/app/admin/election/archived/page.jsx`
- `frontend/src/app/admin/election/deleted/page.jsx`

## Testing

After applying the migration, test the following:

1. **Archive an election** - should move to archived folder
2. **Delete an election** - should move to deleted folder
3. **Restore from archive** - should return to active elections
4. **Restore from delete** - should return to active elections
5. **Permanent delete** - should remove from database completely

## Notes

- The system now works exactly like the admin management system
- All existing data will be preserved and properly migrated
- The `is_archived` column is no longer used but kept for backward compatibility
- The system is more robust and handles edge cases better
