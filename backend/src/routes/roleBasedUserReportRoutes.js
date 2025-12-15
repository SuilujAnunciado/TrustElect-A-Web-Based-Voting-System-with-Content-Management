const express = require('express');
const router = express.Router();
const roleBasedUserReportController = require('../controllers/roleBasedUserReportController');
const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');


<<<<<<< HEAD

=======
// Get role-based user summary
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/summary', 
verifyToken,
isSuperAdmin,
  roleBasedUserReportController.getRoleBasedUserSummary
);

<<<<<<< HEAD
=======
// Get role-based user details by role ID
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/details/:roleId',
verifyToken,
isSuperAdmin,
  roleBasedUserReportController.getRoleBasedUserDetails
);

module.exports = router; 