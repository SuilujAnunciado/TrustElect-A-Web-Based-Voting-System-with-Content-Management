const FailedLoginModel = require('../models/failedLoginModel');

exports.getFailedLoginReport = async (req, res) => {
  try {
    const data = await FailedLoginModel.getFailedLoginSummary();
    
    res.json({
      success: true,
      data: {
        total_attempts: data.total_attempts,
        locked_accounts: data.locked_accounts,
<<<<<<< HEAD
        high_risk_ips: 0, 
=======
        high_risk_ips: 0, // Removed as per requirement
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        recent_attempts: data.recent_attempts.map(attempt => ({
          timestamp: attempt.timestamp,
          email: attempt.email,
          reason: attempt.reason,
          status: attempt.status
        })),
        time_distribution: data.time_distribution.map(time => ({
          hour: time.hour.toString().padStart(2, '0'),
          count: parseInt(time.count)
        }))
      }
    });
  } catch (error) {
    console.error('Error in getFailedLoginReport:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch failed login report'
    });
  }
}; 