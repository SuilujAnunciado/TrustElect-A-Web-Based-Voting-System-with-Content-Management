const express = require('express');
const router = express.Router();
const { getCandidateList } = require('../controllers/candidateListReportController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');

<<<<<<< HEAD
router.get('/', verifyToken, isSuperAdmin, getCandidateList);

router.get('/admin/candidate-list', verifyToken, isAdmin, getCandidateList);


=======
// Route to get candidate list report for super admin
router.get('/', verifyToken, isSuperAdmin, getCandidateList);

// Route to get candidate list report for admin
router.get('/admin/candidate-list', verifyToken, isAdmin, getCandidateList);

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
module.exports = router; 