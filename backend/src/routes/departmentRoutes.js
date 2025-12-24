const express = require("express");
const router = express.Router();
const { verifyToken, isSuperAdmin, isAdmin } = require("../middlewares/authMiddleware");
const departmentController = require("../controllers/departmentController");

const isAdminOrSuperAdmin = (req, res, next) => {

  
  if (req.user.normalizedRole === 'Admin' || req.user.normalizedRole === 'Super Admin' || 
      req.user.role === 'Admin' || req.user.role === 'Super Admin' ||
      req.user.role_id === 1 || req.user.role_id === 2) {
    next();
  } else {
    return res.status(403).json({ message: "Access denied. Admin or Super Admin required." });
  }
};


router.get("/departments", verifyToken, (req, res, next) => {
  next();
}, isAdminOrSuperAdmin, departmentController.getAllDepartments);

router.get("/departments/archived", verifyToken, (req, res, next) => {
  next();
}, isAdminOrSuperAdmin, departmentController.getArchivedDepartments);

router.get("/department-names", verifyToken, departmentController.getDepartmentNames);

router.get("/departments/:id", verifyToken, departmentController.getDepartmentById);

router.get("/departments/:id/admins", verifyToken, departmentController.getAdminsByDepartment);

router.post("/departments", verifyToken, isAdminOrSuperAdmin, departmentController.createDepartment);

router.put("/departments/:id", verifyToken, isAdminOrSuperAdmin, departmentController.updateDepartment);

router.delete("/departments/:id", verifyToken, isAdminOrSuperAdmin, departmentController.deleteDepartment);

router.patch("/departments/:id/restore", verifyToken, isAdminOrSuperAdmin, departmentController.restoreDepartment);

router.delete("/departments/:id/permanent", verifyToken, isAdminOrSuperAdmin, departmentController.permanentDelete);

module.exports = router;  