# Academic Terms Migration

This migration adds support for organizing students by academic terms (school year + term).

## Running the Migration

**IMPORTANT:** You must run this migration before using the student management features with academic terms.

### Steps:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the migration script:
   ```bash
   node src/migrations/apply_academic_terms.js
   ```

3. Verify the migration succeeded:
   - The script will output "Migration completed successfully!"
   - Check that the `academic_terms` table exists in your database
   - Verify that a default term "2025-2026 Term 1" was created

## What This Migration Does

1. **Creates `academic_terms` table** - Stores school year and term combinations
2. **Adds `academic_term_id` column** to the `students` table
3. **Backfills existing students** - Assigns all existing students to the default term "2025-2026 Term 1"
4. **Sets up foreign key constraint** - Ensures data integrity
5. **Creates default term** - "2025-2026 Term 1" is created and marked as current

## Troubleshooting

### Error: "permission denied for table academic_terms"

This means the migration hasn't been run yet. Run the migration script as described above.

### Error: "relation academic_terms does not exist"

Same as above - the table hasn't been created. Run the migration.

### Migration fails partway through

The migration uses transactions, so if it fails, nothing will be committed. You can safely re-run it. The script handles "already exists" errors gracefully.

## After Migration

Once the migration is complete:
- The student management pages will load properly
- You can create new academic terms via the UI
- Students will be organized by term
- You can switch between terms to view different student rosters

