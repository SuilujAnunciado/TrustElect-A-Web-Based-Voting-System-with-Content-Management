const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin, isAdmin, allowRoles } = require('../middlewares/authMiddleware');
const { getSystemLoad } = require('../controllers/systemLoadController');
const { resetSystemLoadData, getResetStatus } = require('../controllers/systemLoadResetController');

const isAdminOrSuperAdmin = allowRoles("Super Admin", "Admin");

router.get('/system-load', verifyToken, isAdminOrSuperAdmin, getSystemLoad);

router.post('/system-load/reset', verifyToken, isSuperAdmin, resetSystemLoadData);


router.get('/system-load/status', verifyToken, isSuperAdmin, getResetStatus);

module.exports = router; 