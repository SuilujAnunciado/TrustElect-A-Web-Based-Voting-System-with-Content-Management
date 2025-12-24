const express = require('express');
const router = express.Router();
const roleBasedUserReportController = require('../controllers/roleBasedUserReportController');
const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');

router.get('/summary', 
verifyToken,
isSuperAdmin,
  roleBasedUserReportController.getRoleBasedUserSummary
);

router.get('/details/:roleId',
verifyToken,
isSuperAdmin,
  roleBasedUserReportController.getRoleBasedUserDetails
);

module.exports = router; 