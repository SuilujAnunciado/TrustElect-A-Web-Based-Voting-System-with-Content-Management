const cron = require('node-cron');
const { updateElectionStatuses, getElectionById } = require('../models/electionModel');
const pool = require('../config/db');
const notificationService = require('../services/notificationService');

<<<<<<< HEAD

=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
cron.schedule('* * * * *', async () => {
  try {
   
    const result = await updateElectionStatuses();
    if (result.statusChanges && result.statusChanges.length > 0) {
  
      for (const change of result.statusChanges) {
        try {
         
          const election = await getElectionById(change.id);
          if (election) {
            await notificationService.notifyElectionStatusChange(election, change.oldStatus, change.newStatus);
          }
        } catch (notifError) {
          console.error(`[CRON] Error sending notification for election ${change.id}:`, notifError);
        }
      }
    }
    
    await pool.query('SELECT 1');
  } catch (error) {
    console.error('[CRON] Error:', error);
  }
});

module.exports = cron;