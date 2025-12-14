const express = require('express');
const router = express.Router();
const { getCandidateList } = require('../controllers/candidateListReportController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isSuperAdmin, getCandidateList);

router.get('/admin/candidate-list', verifyToken, isAdmin, getCandidateList);


module.exports = router; 