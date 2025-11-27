# 📌 QUICK REFERENCE CARD

## 🚀 Quick Start (3 Steps)

### 1️⃣ Run This SQL File
```sql
database_academic_terms_WITH_HISTORY.sql
```
This creates 7 terms (6 past + 1 current)

### 2️⃣ Go Here
```
Student Management → See Academic Term dropdown
```

### 3️⃣ Done!
- View students by semester using dropdown
- Super Admin: Click "+ New Term" to create new semesters

---

## 📊 Database Tables

### Table 1: `academic_terms`
```
Columns:
- id (SERIAL)
- school_year (VARCHAR) → "2025-2026"
- term (VARCHAR) → "1st Semester"
- is_current (BOOLEAN) → Only ONE is TRUE
- is_active (BOOLEAN)
- created_at, updated_at
```

### Table 2: `students` (UPDATED)
```
New Column:
- academic_term_id (INTEGER) → Links to academic_terms.id
```

---

## 🎛️ UI Controls

### Academic Term Dropdown
```
Location: Top of Student Management page
Shows: All available terms
Current term marked with ✓
Select any term to view its students
```

### + New Term Button (Super Admin Only)
```
Location: Next to Academic Term dropdown
Click to: Create new semester
Opens modal with form
```

### Current Term Display
```
Location: Below page title
Shows: "School Year: 2025-2026 - 1st Semester"
Updates when you change current term
```

---

## 👥 User Permissions

| Feature | Super Admin | Admin |
|---------|------------|-------|
| View terms dropdown | ✅ | ✅ |
| Switch between terms | ✅ | ✅ |
| Create new terms | ✅ | ❌ |
| Set current term | ✅ | ❌ |
| Upload students | ✅ | ✅ |
| View past data | ✅ | ✅ |

---

## 📝 Common Tasks

### Creating New Semester
```
1. Click [+ New Term]
2. School Year: 2025-2026
3. Term: Select from dropdown
4. ☑ Set as current
5. [Create Term]
```

### Viewing Past Semester
```
1. Click Academic Term dropdown
2. Select desired term
3. Student list updates automatically
```

### Uploading Students
```
1. Ensure correct current term
2. Click [Batch Upload]
3. Select file
4. Students assigned to current term
```

---

## 🔍 How to Check Setup

### In Database
```sql
-- Check terms exist
SELECT * FROM academic_terms;

-- Check students have term
SELECT COUNT(*) FROM students WHERE academic_term_id IS NULL;
-- Should return 0
```

### In Application
```
1. Go to Student Management
2. See "School Year: ..." at top
3. See Academic Term dropdown works
4. See terms in dropdown
5. Click + New Term (Super Admin)
```

---

## 🆘 Troubleshooting

### Problem: No terms in dropdown
**Fix:** Run the SQL script

### Problem: Can't create new term
**Fix:** 
- Check you're Super Admin
- Format: YYYY-YYYY for school year
- Select a term from dropdown

### Problem: Students showing wrong semester
**Fix:** Check which term is selected in dropdown

### Problem: Upload fails
**Fix:** Ensure a term is set as current

---

## 📋 Term Format Standards

### School Year Format
```
✅ Correct: 2025-2026
❌ Wrong: 2025, 25-26, 2025/2026
```

### Term Names (Common)
```
• 1st Semester
• 2nd Semester  
• Summer
• Term 1
• Term 2
• Term 3
```

---

## 🎯 Key Concepts

### One Current Term
- Only ONE term can be current at a time
- New students go to current term
- Uploads go to current term
- Creating a new current term deactivates the old one

### Separate Records
- Same student in different semesters = different records
- This tracks progression (year level changes)
- Historical data is preserved
- No data is overwritten

### Past Terms Are Read-Only
- Can view past semester students
- Cannot upload to past terms
- Cannot edit which term is past (only current)

---

## 💾 File Reference

### SQL Scripts
```
database_academic_terms_WITH_HISTORY.sql    ← Use this!
database_academic_terms_SIMPLE.sql          ← Or this
database_academic_terms_setup.sql           ← Full version
```

### Documentation
```
IMPLEMENTATION_SUMMARY.md    ← Complete guide
VISUAL_GUIDE.md             ← Screenshots & examples
QUICK_REFERENCE.md          ← This file!
```

---

## 🎓 Example Timeline

### August 2025
```
Create: 2025-2026 1st Semester (current)
Upload: 500 students
Action: Semester runs, elections happen
```

### January 2026
```
Create: 2025-2026 2nd Semester (current)
Upload: 480 students (some new, some re-enrolled)
Action: Semester runs, new elections
View 1st Sem: Still accessible via dropdown
```

### August 2026
```
Create: 2026-2027 1st Semester (current)
Upload: 520 students
Action: New year begins
View Past: All previous semesters still accessible
```

---

## 🏆 Best Practices

### Do This:
✅ Create new term at start of each semester
✅ Set new term as current when creating
✅ Upload all semester students at once
✅ Keep past terms for historical reference
✅ Use consistent naming (1st Semester, 2nd Semester)

### Avoid This:
❌ Don't delete terms with students
❌ Don't manually edit academic_term_id in students
❌ Don't try to move students between terms
❌ Don't upload to non-current terms

---

## 📞 Need Help?

1. Check IMPLEMENTATION_SUMMARY.md for detailed guide
2. Check VISUAL_GUIDE.md for screenshots
3. Verify database setup with SQL queries
4. Ensure a current term is set

---

**Remember:** Everything is in the Student Management page! No separate page needed! 🎉

