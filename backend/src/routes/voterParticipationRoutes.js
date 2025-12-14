const express = require('express');
const router = express.Router();
const { getVoterParticipation } = require('../controllers/voterParticipationController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');

router.get(
  '/voter-participation',
  verifyToken,
  isSuperAdmin,
  getVoterParticipation
);


router.get(
  '/admin/voter-participation',
  verifyToken,
  isAdmin,
  getVoterParticipation
);

module.exports = router; 