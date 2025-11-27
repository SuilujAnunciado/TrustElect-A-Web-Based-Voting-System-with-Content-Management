const express = require('express');
const {
  getAcademicTerms,
  getCurrentTerm,
  getAcademicTermById,
  createAcademicTerm,
  updateAcademicTerm,
  setCurrentTerm,
  deleteAcademicTerm
} = require('../controllers/academicTermController');
const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

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
router.delete('/:id', verifyToken, isSuperAdmin, deleteAcademicTerm);

module.exports = router;

