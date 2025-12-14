const pool = require("../config/db");
const { DateTime } = require("luxon");
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
    
    const newlyCompletedElections = [];
    const newlyOngoingElections = [];

    for (const election of elections) {
      const startDateTime = DateTime.fromISO(election.date_from)
        .setZone(MANILA_TIMEZONE)
        .set({
          hour: election.start_time ? parseInt(election.start_time.split(':')[0]) : 0,
          minute: election.start_time ? parseInt(election.start_time.split(':')[1]) : 0
        });

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
        
        if (newStatus === 'completed' && oldStatus !== 'completed') {
          newlyCompletedElections.push(election);
        } else if (newStatus === 'ongoing' && oldStatus !== 'ongoing') {
          newlyOngoingElections.push(election);
        }
      }
    }

    await client.query('COMMIT');
    
    if (newlyCompletedElections.length > 0) {
      for (const election of newlyCompletedElections) {
        try {
          const { rows } = await pool.query(
            'SELECT * FROM elections WHERE id = $1',
            [election.id]
          );
          
          if (rows.length > 0) {
            const completeElection = rows[0];
            
            await notificationService.notifyStudentsAboutElectionResults(completeElection);
          }
        } catch (error) {
          console.error(`Error sending notifications for completed election ${election.id}:`, error);
        }
      }
    }

    if (newlyOngoingElections.length > 0) {
      for (const election of newlyOngoingElections) {
        try {
          const { rows } = await pool.query(
            'SELECT * FROM elections WHERE id = $1',
            [election.id]
          );
          
          if (rows.length > 0) {
            const completeElection = rows[0];
            
            await notificationService.notifyStudentsAboutElection(completeElection);
          }
        } catch (error) {
          console.error(`Error sending notifications for ongoing election ${election.id}:`, error);
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
setInterval(updateElectionStatuses, 15 * 60 * 1000); 
updateElectionStatuses(); 

module.exports = { updateElectionStatuses };