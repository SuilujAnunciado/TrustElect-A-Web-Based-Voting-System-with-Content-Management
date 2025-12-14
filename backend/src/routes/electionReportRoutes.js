const express = require('express');
const router = express.Router();
const {verifyToken, isSuperAdmin, isAdmin} = require('../middlewares/authMiddleware');

const electionReportController = require('../controllers/electionReportController');

router.get('/summary', 
  verifyToken, 
  isSuperAdmin, 
  electionReportController.getElectionSummary
);


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