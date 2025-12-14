const cron = require('node-cron');
const { cleanupAutoDeleteElections } = require('../models/electionModel');

const autoDeleteCleanupJob = cron.schedule('0 2 * * *', async () => {
  console.log('Starting auto-delete cleanup job...');
  
  try {
    const result = await cleanupAutoDeleteElections();
    console.log(`Auto-delete cleanup completed. Deleted ${result.deleted} elections.`);
  } catch (error) {
    console.error('Auto-delete cleanup job failed:', error);
  }
}, {
  scheduled: false, 
  timezone: "Asia/Manila" 
});


const startAutoDeleteCleanup = () => {
  console.log('Starting auto-delete cleanup cron job...');
  autoDeleteCleanupJob.start();
};

const stopAutoDeleteCleanup = () => {
  console.log('Stopping auto-delete cleanup cron job...');
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
