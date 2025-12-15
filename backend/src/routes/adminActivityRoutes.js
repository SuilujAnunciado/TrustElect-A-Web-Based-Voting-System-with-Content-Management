const express = require('express');
const router = express.Router();
const adminActivityController = require('../controllers/adminActivityController');
const {verifyToken, allowRoles} = require('../middlewares/authMiddleware');

<<<<<<< HEAD

=======
// Routes accessible by both admin and super admin
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/activities', verifyToken, allowRoles("Admin", "Super Admin"), adminActivityController.getAdminActivities);
router.get('/summary', verifyToken, allowRoles("Admin", "Super Admin"), adminActivityController.getAdminActivitySummary);

module.exports = router; 