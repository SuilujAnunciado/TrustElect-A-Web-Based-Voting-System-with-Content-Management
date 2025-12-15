const express = require('express');
const router = express.Router();
const votingTimeController = require('../controllers/votingTimeController');
const {verifyToken, isAdmin } = require('../middlewares/authMiddleware');

<<<<<<< HEAD
router.get('/voting-time-test', verifyToken, isAdmin, votingTimeController.testVotingTimeEndpoint);

router.get('/voting-time', verifyToken, isAdmin, votingTimeController.getVotingTimeData);

router.get('/voting-time/:electionId', verifyToken, isAdmin, votingTimeController.getVotingTimeDataByElection);


=======
// Test endpoint for debugging
router.get('/voting-time-test', verifyToken, isAdmin, votingTimeController.testVotingTimeEndpoint);

// Get all voting time data
router.get('/voting-time', verifyToken, isAdmin, votingTimeController.getVotingTimeData);

// Get voting time data for a specific election
router.get('/voting-time/:electionId', verifyToken, isAdmin, votingTimeController.getVotingTimeDataByElection);

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
module.exports = router; 