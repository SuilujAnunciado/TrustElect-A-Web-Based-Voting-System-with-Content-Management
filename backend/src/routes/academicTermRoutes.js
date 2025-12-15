const express = require('express');
const {
  getAcademicTerms,
  getCurrentTerm,
  getAcademicTermById,
  createAcademicTerm,
  updateAcademicTerm,
  setCurrentTerm,
  deleteAcademicTerm
<<<<<<< HEAD
  
=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
} = require('../controllers/academicTermController');
const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

<<<<<<< HEAD
router.get('/current', verifyToken, getCurrentTerm);

router.get('/', verifyToken, getAcademicTerms);

router.get('/:id', verifyToken, getAcademicTermById);

router.post('/', verifyToken, isSuperAdmin, createAcademicTerm);

router.put('/:id', verifyToken, isSuperAdmin, updateAcademicTerm);

router.patch('/:id/set-current', verifyToken, isSuperAdmin, setCurrentTerm);

=======
// Public route to get current term
router.get('/current', verifyToken, getCurrentTerm);

// Get all academic terms
router.get('/', verifyToken, getAcademicTerms);

// Get academic term by ID
router.get('/:id', verifyToken, getAcademicTermById);

// Create new academic term (Super Admin only)
router.post('/', verifyToken, isSuperAdmin, createAcademicTerm);

// Update academic term (Super Admin only)
router.put('/:id', verifyToken, isSuperAdmin, updateAcademicTerm);

// Set current academic term (Super Admin only)
router.patch('/:id/set-current', verifyToken, isSuperAdmin, setCurrentTerm);

// Delete academic term (Super Admin only)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.delete('/:id', verifyToken, isSuperAdmin, deleteAcademicTerm);

module.exports = router;

