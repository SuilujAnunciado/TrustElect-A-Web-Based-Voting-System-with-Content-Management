const cron = require('node-cron');
const { cleanupAutoDeleteElections } = require('../models/electionModel');

/**
 * Auto-delete cleanup cron job
 * Runs every day at 2:00 AM to clean up elections that are ready for auto-delete
 */
const autoDeleteCleanupJob = cron.schedule('0 2 * * *', async () => {
  console.log('Starting auto-delete cleanup job...');
  
  try {
    const result = await cleanupAutoDeleteElections();
    console.log(`Auto-delete cleanup completed. Deleted ${result.deleted} elections.`);
  } catch (error) {
    console.error('Auto-delete cleanup job failed:', error);
  }
}, {
  scheduled: false, // Don't start automatically
  timezone: "Asia/Manila" // Adjust timezone as needed
});

/**
 * Start the auto-delete cleanup job
 */
const startAutoDeleteCleanup = () => {
  console.log('Starting auto-delete cleanup cron job...');
  autoDeleteCleanupJob.start();
};

/**
 * Stop the auto-delete cleanup job
 */
const stopAutoDeleteCleanup = () => {
  console.log('Stopping auto-delete cleanup cron job...');
  autoDeleteCleanupJob.stop();
};

/**
 * Get the status of the auto-delete cleanup job
 */
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
