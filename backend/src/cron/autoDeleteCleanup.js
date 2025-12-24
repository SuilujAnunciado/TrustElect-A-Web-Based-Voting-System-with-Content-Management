const cron = require('node-cron');
const { cleanupAutoDeleteElections } = require('../models/electionModel');

const autoDeleteCleanupJob = cron.schedule('0 2 * * *', async () => {

  try {
    const result = await cleanupAutoDeleteElections();
  } catch (error) {
    console.error('Auto-delete cleanup job failed:', error);
  }
}, {
  scheduled: false, 
  timezone: "Asia/Manila" 
});


const startAutoDeleteCleanup = () => {
  autoDeleteCleanupJob.start();
};

const stopAutoDeleteCleanup = () => {
  autoDeleteCleanupJob.stop();
};

const getAutoDeleteCleanupStatus = () => {
  return {
    running: autoDeleteCleanupJob.running,
    scheduled: autoDeleteCleanupJob.scheduled
  };
};

module.exports = {
  startAutoDeleteCleanup,
  stopAutoDeleteCleanup,
  getAutoDeleteCleanupStatus,
  autoDeleteCleanupJob
};
