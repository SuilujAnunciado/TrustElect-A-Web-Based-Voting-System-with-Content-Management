const pool = require("../config/db");
const { DateTime } = require("luxon");
<<<<<<< HEAD
=======
// Import the notification service
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const notificationService = require("./notificationService");

const MANILA_TIMEZONE = "Asia/Manila";

async function updateElectionStatuses() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { rows: elections } = await client.query(
      `SELECT id, title, date_from, date_to, start_time, end_time, status 
       FROM elections 
       WHERE status != 'archived'`
    );

    const now = DateTime.now().setZone(MANILA_TIMEZONE);
    
<<<<<<< HEAD
    const newlyCompletedElections = [];
    const newlyOngoingElections = [];


=======
    // Track elections that transitioned to completed or ongoing status
    const newlyCompletedElections = [];
    const newlyOngoingElections = [];

>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    for (const election of elections) {
      const startDateTime = DateTime.fromISO(election.date_from)
        .setZone(MANILA_TIMEZONE)
        .set({
          hour: election.start_time ? parseInt(election.start_time.split(':')[0]) : 0,
          minute: election.start_time ? parseInt(election.start_time.split(':')[1]) : 0
        });

<<<<<<< HEAD
        
=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const endDateTime = DateTime.fromISO(election.date_to)
        .setZone(MANILA_TIMEZONE)
        .set({
          hour: election.end_time ? parseInt(election.end_time.split(':')[0]) : 23,
          minute: election.end_time ? parseInt(election.end_time.split(':')[1]) : 59
        });

      let newStatus = election.status;
      const oldStatus = election.status;

      if (now < startDateTime) {
        newStatus = 'upcoming';
      } else if (now >= startDateTime && now <= endDateTime) {
        newStatus = 'ongoing';
      } else if (now > endDateTime) {
        newStatus = 'completed';
      }

      if (newStatus !== oldStatus) {
        await client.query(
          `UPDATE elections 
           SET status = $1, last_status_update = NOW() 
           WHERE id = $2`,
          [newStatus, election.id]
        );
        
<<<<<<< HEAD
=======
        // Track status changes for notifications
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        if (newStatus === 'completed' && oldStatus !== 'completed') {
          newlyCompletedElections.push(election);
        } else if (newStatus === 'ongoing' && oldStatus !== 'ongoing') {
          newlyOngoingElections.push(election);
        }
      }
    }

    await client.query('COMMIT');
    
<<<<<<< HEAD
    if (newlyCompletedElections.length > 0) {
      for (const election of newlyCompletedElections) {
        try {
=======
    // After transaction is committed, send notifications for status changes
    if (newlyCompletedElections.length > 0) {
      // Process each completed election
      for (const election of newlyCompletedElections) {
        try {
          // Get complete election details for the notification
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
          const { rows } = await pool.query(
            'SELECT * FROM elections WHERE id = $1',
            [election.id]
          );
          
          if (rows.length > 0) {
            const completeElection = rows[0];
            
<<<<<<< HEAD
=======
            // Send notifications to students
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
            await notificationService.notifyStudentsAboutElectionResults(completeElection);
          }
        } catch (error) {
          console.error(`Error sending notifications for completed election ${election.id}:`, error);
<<<<<<< HEAD
=======
          // Continue with other elections even if one fails
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        }
      }
    }

    if (newlyOngoingElections.length > 0) {
<<<<<<< HEAD
      for (const election of newlyOngoingElections) {
        try {
=======
      // Process each election that became ongoing
      for (const election of newlyOngoingElections) {
        try {
          // Get complete election details for the notification
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
          const { rows } = await pool.query(
            'SELECT * FROM elections WHERE id = $1',
            [election.id]
          );
          
          if (rows.length > 0) {
            const completeElection = rows[0];
            
<<<<<<< HEAD
=======
            // Send notifications to students that election is now ongoing
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
            await notificationService.notifyStudentsAboutElection(completeElection);
          }
        } catch (error) {
          console.error(`Error sending notifications for ongoing election ${election.id}:`, error);
<<<<<<< HEAD
=======
          // Continue with other elections even if one fails
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        }
      }
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating election statuses:', error);
    throw error;
  } finally {
    client.release();
  }
}
<<<<<<< HEAD
setInterval(updateElectionStatuses, 15 * 60 * 1000); 
updateElectionStatuses(); 
=======

// Run this more frequently to catch elections ending
setInterval(updateElectionStatuses, 15 * 60 * 1000); // Every 15 minutes
updateElectionStatuses(); // Run immediately on startup
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b

module.exports = { updateElectionStatuses };