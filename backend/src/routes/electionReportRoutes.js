const express = require('express');
const router = express.Router();
const {verifyToken, isSuperAdmin, isAdmin} = require('../middlewares/authMiddleware');

const electionReportController = require('../controllers/electionReportController');

<<<<<<< HEAD
=======
// Super Admin routes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/summary', 
  verifyToken, 
  isSuperAdmin, 
  electionReportController.getElectionSummary
);

<<<<<<< HEAD

=======
// Admin routes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/admin/summary', 
  verifyToken, 
  isAdmin, 
  electionReportController.getElectionSummary
);

router.get('/details/:id', 
  verifyToken, 
  isSuperAdmin, 
  electionReportController.getElectionDetails
);

<<<<<<< HEAD
=======
// New route for upcoming elections report
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/upcoming-elections',
  verifyToken,
  isSuperAdmin,
  electionReportController.getUpcomingElections
);

router.get('/live-vote-count',
  verifyToken,
  isSuperAdmin,
  electionReportController.getLiveVoteCount
);

module.exports = router; 