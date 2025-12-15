const pool = require('../config/db');

<<<<<<< HEAD

class FailedLoginModel {
  static async getFailedLoginSummary() {
    try {
  
=======
class FailedLoginModel {
  static async getFailedLoginSummary() {
    try {
      // Get total failed attempts
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const totalAttemptsQuery = `
        SELECT COUNT(*) as total_attempts
        FROM audit_logs
        WHERE action = 'LOGIN_FAILED'
        AND created_at >= NOW() - INTERVAL '30 days'
      `;
      const totalAttempts = await pool.query(totalAttemptsQuery);

<<<<<<< HEAD
=======
      // Get locked accounts count - accounts with 3 or more failed attempts within 30 minutes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const lockedAccountsQuery = `
        WITH recent_failures AS (
          SELECT 
            user_email,
            COUNT(*) as failure_count,
            MAX(created_at) as last_failure
          FROM audit_logs
          WHERE action = 'LOGIN_FAILED'
          AND created_at >= NOW() - INTERVAL '30 minutes'
          AND user_email IS NOT NULL
          GROUP BY user_email
          HAVING COUNT(*) >= 3
        )
        SELECT COUNT(*) as locked_accounts
        FROM recent_failures
      `;
      const lockedAccounts = await pool.query(lockedAccountsQuery);

<<<<<<< HEAD
=======
      // Get recent failed attempts with locked status
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const recentAttemptsQuery = `
        WITH recent_failures AS (
          SELECT 
            user_email,
            COUNT(*) as failure_count
          FROM audit_logs
          WHERE action = 'LOGIN_FAILED'
          AND created_at >= NOW() - INTERVAL '30 minutes'
          AND user_email IS NOT NULL
          GROUP BY user_email
        )
        SELECT 
          al.id,
          al.created_at as timestamp,
          al.user_email as email,
          COALESCE(al.details->>'reason', 'Invalid credentials') as reason,
          CASE 
            WHEN rf.failure_count >= 3 THEN 'locked'
            ELSE 'failed'
          END as status
        FROM audit_logs al
        LEFT JOIN recent_failures rf ON al.user_email = rf.user_email
        WHERE al.action = 'LOGIN_FAILED'
        AND al.created_at >= NOW() - INTERVAL '30 days'
        AND al.user_email IS NOT NULL
        ORDER BY al.created_at DESC
        LIMIT 10
      `;
      const recentAttempts = await pool.query(recentAttemptsQuery);

<<<<<<< HEAD
=======
      // Get time distribution
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const timeDistributionQuery = `
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as count
        FROM audit_logs
        WHERE action = 'LOGIN_FAILED'
        AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `;
      const timeDistribution = await pool.query(timeDistributionQuery);

<<<<<<< HEAD
=======
      // Format the response
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const response = {
        total_attempts: parseInt(totalAttempts.rows[0]?.total_attempts) || 0,
        locked_accounts: parseInt(lockedAccounts.rows[0]?.locked_accounts) || 0,
        recent_attempts: recentAttempts.rows.map(attempt => ({
          ...attempt,
          reason: attempt.reason || 'Invalid credentials'
        })),
        time_distribution: timeDistribution.rows.map(row => ({
          hour: row.hour.toString().padStart(2, '0'),
          count: parseInt(row.count)
        }))
      };

      console.log('Failed Login Report Data:', response);
      return response;
    } catch (error) {
      console.error('Error in getFailedLoginSummary:', error);
      throw error;
    }
  }
}

module.exports = FailedLoginModel; 