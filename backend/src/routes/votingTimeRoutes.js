const express = require('express');
const router = express.Router();
const votingTimeController = require('../controllers/votingTimeController');
const {verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/voting-time-test', verifyToken, isAdmin, votingTimeController.testVotingTimeEndpoint);

router.get('/voting-time', verifyToken, isAdmin, votingTimeController.getVotingTimeData);

router.get('/voting-time/:electionId', verifyToken, isAdmin, votingTimeController.getVotingTimeDataByElection);


module.exports = router; 