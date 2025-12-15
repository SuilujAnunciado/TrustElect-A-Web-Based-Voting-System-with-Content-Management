const express = require('express');
const { getDepartmentVoterReport } = require('../controllers/departmentVoterReportController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

<<<<<<< HEAD
router.get('/department-voter', verifyToken, isAdmin, getDepartmentVoterReport);


=======
// Get department voter report with optional filters
router.get('/department-voter', verifyToken, isAdmin, getDepartmentVoterReport);

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
module.exports = router; 