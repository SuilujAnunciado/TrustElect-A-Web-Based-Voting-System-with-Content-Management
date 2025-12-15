const express = require("express");
const { check } = require("express-validator");
const { registerAdmin, getAllAdmins, getArchivedAdmins, updateAdmin, softDeleteAdmin, restoreAdmin, resetAdminPassword, permanentlyDeleteAdmin, unlockAdminAccount, getAdminProfile, uploadAdminProfilePicture} = require("../controllers/adminController");
const { verifyToken, isAdmin, isSuperAdmin } = require("../middlewares/authMiddleware");
const { checkPermission } = require("../middlewares/permissionMiddleware");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

<<<<<<< HEAD

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../../uploads/admins');

=======
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '../../uploads/admins');
    // Ensure the directory exists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "admin-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
<<<<<<< HEAD
  limits: { fileSize: 2 * 1024 * 1024 }, 
=======
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

<<<<<<< HEAD
router.get("/profile", verifyToken, isAdmin, getAdminProfile);
router.post("/upload", verifyToken, isAdmin, upload.single("profilePic"), uploadAdminProfilePicture);

router.get("/admins", verifyToken, (req, res, next) => {
=======
// Admin profile routes
router.get("/profile", verifyToken, isAdmin, getAdminProfile);
router.post("/upload", verifyToken, isAdmin, upload.single("profilePic"), uploadAdminProfilePicture);

// Super admin routes (also accessible by admins for department management)
router.get("/admins", verifyToken, (req, res, next) => {
  // Allow both super admins and regular admins
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Super Admin or Admin role required." });
  }
}, getAllAdmins);

<<<<<<< HEAD
=======
// Admin management routes for regular admins with permissions
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get("/manage-admins", verifyToken, isAdmin, checkPermission('adminManagement', 'view'), getAllAdmins);

router.post(
  "/admins",
  verifyToken,
  isSuperAdmin,
  [
    check("firstName", "First Name is required and must be 1-35 characters.")
      .not().isEmpty()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("lastName", "Last Name is required and must be 1-35 characters.")
      .not().isEmpty()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("email", "Valid email is required")
      .isEmail()
      .custom((value) => {
        if (!value.endsWith("@novaliches.sti.edu.ph") && !value.endsWith("@novaliches.sti.edu")) {
          throw new Error("Email must end with @novaliches.sti.edu.ph or @novaliches.sti.edu");
        }
        return true;
      }),
    check("employeeNumber", "Employee Number must be 3-8 alphanumeric characters.")
      .isLength({ min: 3, max: 8 })
      .matches(/^[a-zA-Z0-9]+$/),
    check("department", "Department is required.").not().isEmpty(),
  ],
  registerAdmin
);

router.put(
  "/admins/:id",
  verifyToken,
  (req, res, next) => {
<<<<<<< HEAD
=======
    // Allow both super admins and regular admins
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: "Access denied. Super Admin or Admin role required." });
    }
  },
  [
    check("firstName", "First Name must be 1-35 characters and contain only letters.")
      .optional()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("lastName", "Last Name must be 1-35 characters and contain only letters.")
      .optional()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("email", "Valid email is required")
      .optional()
      .isEmail()
      .custom((value) => {
        if (value && !value.endsWith("@novaliches.sti.edu.ph") && !value.endsWith("@novaliches.sti.edu")) {
          throw new Error("Email must end with @novaliches.sti.edu.ph or @novaliches.sti.edu");
        }
        return true;
      }),
    check("employeeNumber", "Employee Number must be 3-8 alphanumeric characters.")
      .optional()
      .isLength({ min: 3, max: 8 })
      .matches(/^[a-zA-Z0-9]+$/),
    check("department", "Department is required.").optional().not().isEmpty(),
  ],
  updateAdmin
);
router.delete("/admins/:id", verifyToken, isSuperAdmin, softDeleteAdmin);
router.patch("/admins/:id/restore", verifyToken, isSuperAdmin, restoreAdmin);
router.delete("/admins/:id/permanent-delete", verifyToken, isSuperAdmin, permanentlyDeleteAdmin);
router.patch("/admins/:id/unlock", verifyToken, (req, res, next) => {
<<<<<<< HEAD
=======
  // Allow both super admins and regular admins
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Super Admin or Admin role required." });
  }
}, unlockAdminAccount);

router.post("/admins/reset-password", verifyToken, isSuperAdmin, resetAdminPassword);

<<<<<<< HEAD
=======
// Admin management routes for regular admins with permissions
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get("/manage-admins", verifyToken, isAdmin, checkPermission('adminManagement', 'view'), getAllAdmins);
router.put(
  "/manage-admins/:id",
  verifyToken,
  isAdmin,
  checkPermission('adminManagement', 'edit'),
  [
    check("firstName", "First Name must be 1-35 characters and contain only letters.")
      .optional()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("lastName", "Last Name must be 1-35 characters and contain only letters.")
      .optional()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("email", "Valid email is required")
      .optional()
      .isEmail()
      .custom((value) => {
        if (value && !value.endsWith("@novaliches.sti.edu.ph") && !value.endsWith("@novaliches.sti.edu")) {
          throw new Error("Email must end with @novaliches.sti.edu.ph or @novaliches.sti.edu");
        }
        return true;
      }),
    check("employeeNumber", "Employee Number must be 3-8 alphanumeric characters.")
      .optional()
      .isLength({ min: 3, max: 8 })
      .matches(/^[a-zA-Z0-9]+$/),
    check("department", "Department is required.").optional().not().isEmpty(),
  ],
  updateAdmin
);
router.post(
  "/manage-admins",
  verifyToken,
  isAdmin,
  checkPermission('adminManagement', 'create'),
  [
    check("firstName", "First Name is required and must be 1-35 characters.")
      .not().isEmpty()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("lastName", "Last Name is required and must be 1-35 characters.")
      .not().isEmpty()
      .isLength({ min: 1, max: 35 })
      .matches(/^[a-zA-Z\s]+$/),
    check("email", "Valid email is required")
      .isEmail()
      .custom((value) => {
        if (!value.endsWith("@novaliches.sti.edu.ph") && !value.endsWith("@novaliches.sti.edu")) {
          throw new Error("Email must end with @novaliches.sti.edu.ph or @novaliches.sti.edu");
        }
        return true;
      }),
    check("employeeNumber", "Employee Number must be 3-8 alphanumeric characters.")
      .isLength({ min: 3, max: 8 })
      .matches(/^[a-zA-Z0-9]+$/),
    check("department", "Department is required.").not().isEmpty(),
  ],
  registerAdmin
);
router.delete("/manage-admins/:id", verifyToken, isAdmin, checkPermission('adminManagement', 'delete'), softDeleteAdmin);
router.get("/manage-admins/archived", verifyToken, isAdmin, checkPermission('adminManagement', 'view'), getArchivedAdmins);
router.patch("/manage-admins/:id/restore", verifyToken, isAdmin, checkPermission('adminManagement', 'edit'), restoreAdmin);
router.delete("/manage-admins/:id/permanent", verifyToken, isAdmin, checkPermission('adminManagement', 'delete'), permanentlyDeleteAdmin);
router.patch("/manage-admins/:id/unlock", verifyToken, isAdmin, checkPermission('adminManagement', 'edit'), unlockAdminAccount);
router.post("/manage-admins/reset-password", verifyToken, isAdmin, checkPermission('adminManagement', 'edit'), resetAdminPassword);

router.get("/protected", verifyToken, isSuperAdmin, (req, res) => {
  res.status(200).json({ message: "Welcome, Super Admin! This is a protected route." });
});

<<<<<<< HEAD
router.get('/permissions', verifyToken, async (req, res) => {
  try {
    const adminId = req.user.id;

    const { getAdminPermissions } = require('../models/adminPermissionModel');
    const permissions = await getAdminPermissions(adminId);

=======
// Add admin's own permissions route
router.get('/permissions', verifyToken, async (req, res) => {
  try {
    // The user ID is available from the JWT token in req.user.id
    const adminId = req.user.id;
    
    // Use the existing getAdminPermissions function
    const { getAdminPermissions } = require('../models/adminPermissionModel');
    const permissions = await getAdminPermissions(adminId);
    
    // Format permissions for the frontend
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const formattedPermissions = {};
    permissions.forEach(perm => {
      formattedPermissions[perm.module] = {
        canView: perm.can_view,
        canCreate: perm.can_create,
        canEdit: perm.can_edit,
        canDelete: perm.can_delete
      };
    });
    
    res.json({ permissions: formattedPermissions });
  } catch (error) {
    console.error("Error getting admin permissions:", error);
    res.status(500).json({ message: "Failed to retrieve permissions" });
  }
});

<<<<<<< HEAD
=======
// Department routes are handled by departmentRoutes.js with proper middleware

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
module.exports = router;
