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

router.get('/current', verifyToken, getCurrentTerm);

router.get('/', verifyToken, getAcademicTerms);

router.get('/:id', verifyToken, getAcademicTermById);

router.post('/', verifyToken, isSuperAdmin, createAcademicTerm);

router.put('/:id', verifyToken, isSuperAdmin, updateAcademicTerm);

router.patch('/:id/set-current', verifyToken, isSuperAdmin, setCurrentTerm);

router.delete('/:id', verifyToken, isSuperAdmin, deleteAcademicTerm);

module.exports = router;

