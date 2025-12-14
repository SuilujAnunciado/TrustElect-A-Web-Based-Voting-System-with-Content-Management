const express = require('express');
const router = express.Router();
const {
  getLaboratoryPrecincts,
  getLaboratoryPrecinctById,
  addIPAddress,
  updateIPAddress,
  deleteIPAddress,
  validateStudentVotingIP,
  getStudentLaboratoryAssignment
} = require('../controllers/laboratoryPrecinctController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');


router.get('/', verifyToken, getLaboratoryPrecincts);
router.get('/:id', verifyToken, getLaboratoryPrecinctById);

router.post('/:id/ip-addresses', verifyToken, checkPermission("maintenance", "create"), addIPAddress);
router.put('/ip-addresses/:ipId', verifyToken, checkPermission("maintenance", "update"), updateIPAddress);
router.delete('/ip-addresses/:ipId', verifyToken, checkPermission("maintenance", "delete"), deleteIPAddress);

router.post('/validate-ip', verifyToken, validateStudentVotingIP);
router.get('/student/:studentId/election/:electionId', verifyToken, getStudentLaboratoryAssignment);

module.exports = router;
