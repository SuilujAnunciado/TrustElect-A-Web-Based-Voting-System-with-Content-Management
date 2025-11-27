# Academic Term Management - Quick Start Guide

## 🎯 What Changed?

The school year is no longer hardcoded! You can now:
- ✅ Manage multiple school years and semesters
- ✅ Upload different student batches per semester
- ✅ View historical student records by semester
- ✅ Track student progression across terms
- ✅ Re-enroll students with updated information

## 🚀 Getting Started (First Time Setup)

### Step 1: Access Academic Term Management
1. Login as **Super Admin**
2. Go to **"Academic Terms"** in the navigation menu
3. You'll see the Academic Term Management page

### Step 2: Create Your First Term
1. Click **"Add New Term"** button
2. Fill in the form:
   - **School Year:** `2025-2026`
   - **Term:** `1st Semester`
   - ✅ Check **"Set as current term"**
3. Click **"Create Term"**

### Step 3: Upload Students
1. Go to **"Student Management"**
2. You'll now see: `School Year: 2025-2026 - 1st Semester`
3. Use **"Batch Upload"** or **"Add New Student"** as usual
4. Students are automatically assigned to the current term

## 📖 Common Tasks

### Creating a New Semester

**When to do this:** At the start of 2nd semester, or new school year

1. Go to **Academic Terms** page
2. Click **"Add New Term"**
3. Enter details:
   ```
   School Year: 2025-2026
   Term: 2nd Semester
   ✅ Set as current term
   ```
4. Click **"Create Term"**

**What happens:**
- Previous term is automatically deactivated
- New term becomes current
- Ready to upload students for new semester

### Uploading Students for New Semester

**Scenario:** You have a new batch of students for 2nd semester

1. Make sure the new term is set as current
2. Go to **Student Management**
3. Use **"Batch Upload"** with your Excel file
4. Students are uploaded to the new term

**Important:** 
- Students from 1st semester remain in 1st semester
- New uploads create NEW records in 2nd semester
- Even if same student name/number - they're separate records
- This tracks year level changes, course transfers, etc.

### Viewing Previous Semester Data

**Scenario:** You want to see who was enrolled in 1st semester

1. Go to **Student Management**
2. Use the **"Academic Term"** dropdown at top
3. Select the term you want to view
4. Student list updates to show that semester only

### Re-enrolling a Student

**Scenario:** Maria was in BSIT 1st Year in Sem 1, now BSIT 2nd Year in Sem 2

1. Make sure current term is set to "2nd Semester"
2. Upload Maria again (batch or manual)
3. Enter new information:
   - Year Level: `2nd Year` (updated)
   - Everything else can be same
4. System creates a NEW record for Sem 2

**Result:**
- Sem 1: Maria - BSIT 1st Year (preserved)
- Sem 2: Maria - BSIT 2nd Year (new record)

## 🎓 Real-World Example

### Scenario: Complete Academic Year

#### August 2025 - Start of 1st Semester
```
1. Create term: "2025-2026" - "1st Semester" (set as current)
2. Upload 500 students for 1st semester
3. Students vote in elections during semester
```

#### January 2026 - Start of 2nd Semester  
```
1. Create term: "2025-2026" - "2nd Semester" (set as current)
2. Upload students for 2nd semester (may be 450 students, some dropped, some new)
3. Students vote in new semester's elections
```

#### View 1st Semester Data Anytime
```
1. Use Academic Term dropdown
2. Select "2025-2026 - 1st Semester"
3. See exactly who was enrolled in 1st semester
```

## ⚠️ Important Rules

### ✅ DO:
- Create a new term for each semester/term
- Set one term as current before uploading students
- Upload students even if they were in previous term (for progression)
- Keep old terms for historical reference

### ❌ DON'T:
- Delete terms that have students enrolled
- Delete the current term (switch first)
- Try to edit students across terms (they're separate records)

## 🔍 Understanding the System

### Key Concept: Separate Records Per Term

Think of it like this:

```
2025-2026 1st Semester           2025-2026 2nd Semester
├── John (BSIT 1st Year)         ├── John (BSIT 1st Year)
├── Maria (BSCS 2nd Year)        ├── Maria (BSCS 3rd Year) ← year changed
└── Pedro (BSIT 4th Year)        └── Ana (BSIT 1st Year)   ← new student
                                 (Pedro graduated, not in Sem 2)
```

Each column is independent! Changing Sem 2 doesn't affect Sem 1.

## 📊 Features Overview

### For Super Admins:
- ✅ Create academic terms
- ✅ Set current term
- ✅ View student counts per term
- ✅ Delete empty terms
- ✅ Manage term settings

### For Admins:
- ✅ View current term
- ✅ Filter students by term
- ✅ Upload students (to current term)
- ✅ All normal student management

### For Students:
- No visible change - system handles terms automatically

## 🆘 Troubleshooting

### Problem: "No current academic term set"
**Solution:** 
1. Go to Academic Terms page
2. Create a new term OR
3. Click "Set as Current" on an existing term

### Problem: Student list is empty
**Solution:**
1. Check Academic Term dropdown
2. Make sure you've selected the correct term
3. Try selecting "All Terms" to see all students

### Problem: Can't create new term
**Solution:**
1. Make sure School Year is in format: `YYYY-YYYY`
2. Term name can be anything: `1st Semester`, `2nd Semester`, `Summer`, etc.
3. You're logged in as Super Admin

### Problem: Uploaded students don't show
**Solution:**
1. Make sure a term is set as current
2. Check if Academic Term filter is set to current term
3. Refresh the page

## 📞 Need Help?

If you encounter issues:
1. Check if a current term is set
2. Verify you're viewing the correct term in filters
3. Contact system administrator

## 🎉 Benefits

✅ **Accurate Records:** Each semester has complete student list
✅ **Historical Data:** View any past semester anytime  
✅ **Flexibility:** Track student progression automatically
✅ **Clean Data:** No mixing of different semester data
✅ **Easy Management:** Simple interface for term switching

---

**Remember:** The system is designed to keep EVERY semester's data separate and intact. This means you'll always have accurate historical records! 🎓

