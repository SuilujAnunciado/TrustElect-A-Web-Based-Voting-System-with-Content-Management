const express = require("express");
const { check } = require("express-validator");
const { registerStudent, getAllStudents, getStudentById, editStudent, deleteStudent, restoreStudent, resetStudentPassword, permanentDeleteStudent, unlockStudentAccount, uploadStudentsBatch, getStudentElections, getStudentProfile, uploadProfilePicture, getAvailableCriteria, getStudentsByCourses, validateStudentByNumber, searchStudents, changePassword, bulkDeleteStudentsByCourse, bulkPermanentDeleteStudentsByCourse, bulkDeleteArchivedStudentsByCourse, deleteAllStudents, permanentDeleteAllStudents } = require("../controllers/studentController");
const { verifyToken, isStudent, isSuperAdmin, allowRoles } = require("../middlewares/authMiddleware");
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');
const profileUpload = require('../middlewares/profileUploadMiddleware');
const path = require('path');
const fs = require('fs');
const { checkPermission } = require('../middlewares/permissionMiddleware');

<<<<<<< HEAD

=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get("/students/validate", validateStudentByNumber);

router.get("/students/search", searchStudents);

router.get("/students/elections", verifyToken, isStudent, getStudentElections);
router.get("/students/profile", verifyToken, isStudent, getStudentProfile);
router.post("/students/upload", verifyToken, isStudent, profileUpload.single('profilePic'), uploadProfilePicture);

<<<<<<< HEAD
router.get("/images/candidates/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const sanitizedFilename = filename.replace(/\.\./g, '').replace(/\//g, '');
    
    const filePath = path.join(__dirname, '../../uploads/candidates', sanitizedFilename);

=======
// Add a new route to proxy candidate images with proper CORS headers
router.get("/images/candidates/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    // Sanitize filename to prevent path traversal attacks
    const sanitizedFilename = filename.replace(/\.\./g, '').replace(/\//g, '');
    
    const filePath = path.join(__dirname, '../../uploads/candidates', sanitizedFilename);
    
    // Check if file exists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Image not found');
    }
    
<<<<<<< HEAD
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400'); 

=======
    // Set proper CORS headers
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Send the file
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
});

<<<<<<< HEAD
=======
// Debug route for token
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get("/students/debug-token", verifyToken, (req, res) => {
  res.status(200).json({ 
    user: req.user,
    message: "Token debug information",
    hasStudentId: !!req.user.studentId,
  });
});

router.get("/protected", verifyToken, isStudent, (req, res) => {
  res.status(200).json({ message: "Welcome, Student! This is a protected route." });
});


router.get("/students", verifyToken, getAllStudents);


router.get("/students/:id", verifyToken, getStudentById);

router.post(
  "/students",
  verifyToken,
  [
    check("firstName", "First Name is required").not().isEmpty(),
    check("lastName", "Last Name is required").not().isEmpty(),
    check("email", "Valid email is required")
      .isEmail()
      .custom((value) => {
        if (!value.endsWith("@novaliches.sti.edu.ph") && !value.endsWith("@novaliches.sti.edu")) {
          throw new Error("Email must end with @novaliches.sti.edu.ph or @novaliches.sti.edu");
        }
        return true;
      }),
    check("studentNumber", "Student Number must be 11 digits and start with '02000'")
      .matches(/^02000[0-9]{6}$/),
    check("courseName", "Course name is required unless Course ID is provided")
      .if((value, { req }) => !req.body.courseId)
      .not()
      .isEmpty(),
    check("courseId", "Course ID must be a number if provided")
      .optional()
      .isInt(),
    check("yearLevel", "Year Level is required").not().isEmpty(),
    check("gender", "Gender must be Male, Female, or Other").isIn(["Male", "Female", "Other"]),
    check("createdBy", "Super Admin ID is required").isInt(),
  ],
  registerStudent
);

router.put("/students/:id", verifyToken, editStudent);
router.delete("/students/:id", verifyToken, deleteStudent);
router.patch("/students/:id/restore", verifyToken, restoreStudent);
router.patch("/students/:id/unlock", verifyToken, isSuperAdmin, unlockStudentAccount);
router.delete("/students/:id/permanent", verifyToken, permanentDeleteStudent);
router.post("/students/reset-password", verifyToken, isSuperAdmin, resetStudentPassword);
router.post(
  '/students/batch',
  verifyToken,
  isSuperAdmin,
  upload.single('file'),
  [
    check('createdBy', 'Super Admin ID is required').notEmpty()
  ],
  uploadStudentsBatch
);

<<<<<<< HEAD
=======
// Admin batch upload route with permission check
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.post(
  '/admin/students/batch',
  verifyToken,
  checkPermission('users', 'create'),
  upload.single('file'),
  [
    check('createdBy', 'Admin ID is required').notEmpty()
  ],
  uploadStudentsBatch
);

<<<<<<< HEAD
=======
// Admin reset student password route with permission check
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.post(
  '/admin/students/reset-password',
  verifyToken,
  checkPermission('users', 'edit'),
  resetStudentPassword
);

router.get("/by-courses", verifyToken, getStudentsByCourses);

<<<<<<< HEAD
=======
// Admin student management routes with permission checks
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/admin/students',
  verifyToken,
  isSuperAdmin,
  checkPermission('users', 'view'),
  getAllStudents
);

router.post(
  '/admin/students',
  verifyToken,
  isSuperAdmin,
  checkPermission('users', 'create'),
  registerStudent
);

router.put(
  '/admin/students/:id',
  verifyToken,
  isSuperAdmin,
  checkPermission('users', 'edit'),
  editStudent
);

router.delete(
  '/admin/students/:id',
  verifyToken,
  isSuperAdmin,
  checkPermission('users', 'delete'),
  deleteStudent
);

router.post("/students/change-password", verifyToken, isStudent, changePassword);

<<<<<<< HEAD
=======
// Bulk delete routes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.post("/students/bulk-delete-by-course", verifyToken, isSuperAdmin, bulkDeleteStudentsByCourse);
router.post("/students/bulk-permanent-delete-by-course", verifyToken, isSuperAdmin, bulkPermanentDeleteStudentsByCourse);
router.post("/students/bulk-delete-archived-by-course", verifyToken, isSuperAdmin, bulkDeleteArchivedStudentsByCourse);

<<<<<<< HEAD
=======
// Delete all students routes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.post("/students/delete-all", verifyToken, isSuperAdmin, deleteAllStudents);
router.post("/students/permanent-delete-all", verifyToken, isSuperAdmin, permanentDeleteAllStudents);

module.exports = router;
