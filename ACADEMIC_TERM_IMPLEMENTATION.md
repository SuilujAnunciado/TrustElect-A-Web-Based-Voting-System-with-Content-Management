# Academic Term Management System - Implementation Guide

## Overview
This implementation adds a comprehensive academic term (school year + semester) management system to TrustElect. This allows the system to manage students across different semesters and school years while maintaining historical data.

## Key Features

### 1. **Dynamic School Year & Semester Management**
- No longer hardcoded - fully dynamic and manageable
- Format: "School Year 2025-2026 - 1st Semester"
- Supports multiple terms per school year (1st Sem, 2nd Sem, Summer, etc.)

### 2. **Student Records Per Semester**
- Each semester maintains its own batch of student records
- Students can be re-enrolled in new semesters with updated details (year level, course)
- Historical data is preserved - previous semester records remain intact
- Same student can appear in multiple semesters with different information

### 3. **Current Term Concept**
- One term is always marked as "current"
- New student registrations automatically use the current term
- Batch uploads use the current academic term
- Easy switching between terms for data entry

### 4. **Historical Data Viewing**
- View students from any previous semester
- Filter and compare data across different terms
- Maintain accurate historical records for reporting

## Database Structure

### Academic Terms Table
```sql
CREATE TABLE academic_terms (
  id SERIAL PRIMARY KEY,
  school_year VARCHAR(25) NOT NULL,        -- e.g., "2025-2026"
  term VARCHAR(25) NOT NULL,                -- e.g., "1st Semester", "2nd Semester"
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_year, term)
);
```

### Students Table Enhancement
- Added `academic_term_id` column (foreign key to academic_terms)
- Each student record is linked to a specific academic term
- Students can have multiple records across different terms

## Backend Implementation

### New Files Created:

1. **`backend/src/models/academicTermModel.js`**
   - Functions to manage academic terms
   - CRUD operations for terms
   - Get current term
   - Set term as current
   - Get student count per term

2. **`backend/src/controllers/academicTermController.js`**
   - Request handlers for academic term operations
   - Validation and error handling
   - Business logic for term management

3. **`backend/src/routes/academicTermRoutes.js`**
   - REST API endpoints for academic terms
   - Protected routes (Super Admin only for modifications)
   - Public routes for viewing current term

### Modified Files:

1. **`backend/src/models/studentModel.js`**
   - Updated `getAllStudents()` to accept `academicTermId` parameter
   - Modified `registerStudent()` to automatically use current term
   - Ensures all student operations respect academic term context

2. **`backend/src/controllers/studentController.js`**
   - Updated `getAllStudents()` to filter by academic term
   - Supports query parameter `academic_term_id`

3. **`backend/src/app.js`**
   - Registered academic term routes
   - Added `/api/academic-terms` endpoint

## Frontend Implementation

### New Components:

1. **`frontend/src/components/AcademicTermSelector.jsx`**
   - Dropdown to select academic terms
   - Shows current term with indicator
   - Displays student count per term
   - Automatically defaults to current term

2. **`frontend/src/components/CurrentAcademicTerm.jsx`**
   - Displays the current academic term prominently
   - Shows school year and semester
   - Shows total student count for current term

3. **`frontend/src/app/superadmin/academic-terms/page.jsx`**
   - Full management interface for academic terms
   - Create new terms
   - Set current term
   - View student counts per term
   - Delete terms (only if no students enrolled)

### Modified Pages:

1. **`frontend/src/app/superadmin/students/page.jsx`**
   - Added Academic Term Selector
   - Replaced hardcoded school year with CurrentAcademicTerm component
   - Filters students by selected academic term
   - Automatic refresh when term changes

2. **`frontend/src/app/admin/students/page.jsx`**
   - Same changes as superadmin page
   - Respects permission system
   - Consistent UI across roles

## API Endpoints

### Academic Terms Management

#### GET `/api/academic-terms`
- Get all academic terms
- Includes student count for each term
- Requires authentication

#### GET `/api/academic-terms/current`
- Get the current academic term
- Public endpoint (authenticated users)

#### GET `/api/academic-terms/:id`
- Get specific academic term by ID
- Includes student count

#### POST `/api/academic-terms`
- Create new academic term
- Super Admin only
- Body: `{ school_year, term, is_current }`

#### PATCH `/api/academic-terms/:id/set-current`
- Set a term as current (deactivates others)
- Super Admin only

#### DELETE `/api/academic-terms/:id`
- Delete academic term
- Only if no students enrolled
- Cannot delete current term
- Super Admin only

### Student Management (Updated)

#### GET `/api/students?academic_term_id=<id>`
- Filter students by academic term
- Returns students for specified term only

#### GET `/api/superadmin/students?academic_term_id=<id>`
- Same as above for superadmin endpoint

## Usage Workflow

### Setting Up a New School Year

1. **Create New Academic Term:**
   - Go to Super Admin > Academic Terms
   - Click "Add New Term"
   - Enter school year (e.g., "2025-2026")
   - Enter term (e.g., "1st Semester")
   - Check "Set as current term"
   - Submit

2. **Upload Students for New Term:**
   - Go to Student Management
   - Current term is displayed at top
   - Use "Batch Upload" to upload new semester students
   - Students are automatically assigned to current term

3. **Re-enrolling Existing Students:**
   - Students from previous semesters can be re-uploaded
   - Even if their name/student number matches, they're created as NEW records
   - This allows tracking year level progression, course changes, etc.

### Viewing Historical Data

1. **Switch Academic Terms:**
   - Use the Academic Term dropdown filter
   - Select any previous term
   - View students enrolled in that specific term

2. **Compare Across Terms:**
   - Switch between different terms
   - See how student enrollments changed
   - Track course/year level changes

### End of Semester Process

1. **Complete Current Semester:**
   - No special action needed - data is preserved

2. **Start New Semester:**
   - Create new academic term
   - Set as current
   - Upload new batch of students
   - Previous semester data remains viewable

## Important Notes

### Data Preservation
- **No data is overwritten** when creating new terms
- Each term maintains its own complete student list
- Historical accuracy is maintained
- Same student can appear in multiple terms

### Student Re-enrollment
- Students uploaded in new term = NEW records
- Even if student exists in previous term
- Allows tracking of:
  - Year level progression
  - Course changes
  - Re-enrollment status

### Current Term Behavior
- Only ONE term can be current at a time
- Setting new current term automatically deactivates previous
- All new registrations use current term
- Batch uploads use current term

### Deletion Rules
- Cannot delete term if students are enrolled
- Cannot delete the current term
- Must switch current term first, then delete

## Migration Notes

### Existing Data
- Migration script backfills existing students with default term (2025-2026 Term 1)
- All existing students assigned to this default term
- No data loss

### Database Changes
- `academic_terms` table created
- `students.academic_term_id` column added (NOT NULL)
- Foreign key constraint added
- Unique index on (school_year, term)

## Testing Checklist

### Backend
- [ ] Create new academic term
- [ ] Set term as current
- [ ] Get all terms with student counts
- [ ] Filter students by term
- [ ] Student registration uses current term
- [ ] Batch upload uses current term
- [ ] Cannot delete term with students
- [ ] Cannot delete current term

### Frontend
- [ ] Academic term selector displays correctly
- [ ] Current term shows at top of page
- [ ] Selecting term filters student list
- [ ] Student counts update correctly
- [ ] Term management page works
- [ ] Create new term modal functions
- [ ] Set current term button works

## Future Enhancements

1. **Auto-archiving:** Automatically archive old terms after X years
2. **Bulk term operations:** Copy students from one term to another
3. **Academic calendar:** Integration with academic calendar for automatic term switching
4. **Reports by term:** Generate reports comparing different terms
5. **Student progression tracking:** Built-in year level advancement checking

## Support & Troubleshooting

### No Current Term Error
- **Problem:** "No current academic term set"
- **Solution:** Go to Academic Terms management and set a term as current

### Students Not Showing
- **Problem:** Student list is empty
- **Solution:** Check if correct academic term is selected in filter

### Cannot Upload Students
- **Problem:** Batch upload fails with term error
- **Solution:** Ensure a current academic term is set

### Historical Data Missing
- **Problem:** Can't see students from previous semester
- **Solution:** Select the appropriate term in the Academic Term Selector

## Conclusion

This implementation provides a robust, flexible system for managing students across multiple semesters and school years while maintaining complete historical accuracy. The system is designed to scale and can handle multiple years of student data without performance degradation.

