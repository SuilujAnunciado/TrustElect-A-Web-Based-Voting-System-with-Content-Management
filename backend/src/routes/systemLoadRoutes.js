const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin, isAdmin, allowRoles } = require('../middlewares/authMiddleware');
const { getSystemLoad } = require('../controllers/systemLoadController');
const { resetSystemLoadData, getResetStatus } = require('../controllers/systemLoadResetController');

<<<<<<< HEAD
const isAdminOrSuperAdmin = allowRoles("Super Admin", "Admin");

router.get('/system-load', verifyToken, isAdminOrSuperAdmin, getSystemLoad);

router.post('/system-load/reset', verifyToken, isSuperAdmin, resetSystemLoadData);


=======
// Middleware to allow both SuperAdmin and Admin
const isAdminOrSuperAdmin = allowRoles("Super Admin", "Admin");

// Get system load statistics
router.get('/system-load', verifyToken, isAdminOrSuperAdmin, getSystemLoad);

// Reset system load data (only SuperAdmin can reset)
router.post('/system-load/reset', verifyToken, isSuperAdmin, resetSystemLoadData);

// Get reset status (only SuperAdmin can check reset status)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/system-load/status', verifyToken, isSuperAdmin, getResetStatus);

module.exports = router; 