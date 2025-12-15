const express = require('express');
const router = express.Router();
const { getVoterParticipation } = require('../controllers/voterParticipationController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');

<<<<<<< HEAD
=======
// Route to get voter participation report for super admin
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/voter-participation',
  verifyToken,
  isSuperAdmin,
  getVoterParticipation
);

<<<<<<< HEAD

=======
// Route to get voter participation report for admin
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/admin/voter-participation',
  verifyToken,
  isAdmin,
  getVoterParticipation
);

module.exports = router; 