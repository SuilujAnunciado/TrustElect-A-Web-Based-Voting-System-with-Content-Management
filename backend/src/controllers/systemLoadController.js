const pool = require('../config/db');

const getSystemLoad = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    let interval;
    let grouping;
    let dateFormat;
    let extractField;

    // Set the time interval and grouping based on timeframe
    switch (timeframe) {
      case '7d':
        interval = 'INTERVAL \'7 days\'';
        grouping = 'date_trunc(\'hour\', al.created_at)';
        extractField = 'HOUR';
        dateFormat = 'YYYY-MM-DD HH24:MI:SS';
        break;
      case '30d':
        interval = 'INTERVAL \'30 days\'';
        grouping = 'date_trunc(\'day\', al.created_at)';
        extractField = 'DAY';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '60d':
        interval = 'INTERVAL \'60 days\'';
        grouping = 'date_trunc(\'day\', al.created_at)';
        extractField = 'DAY';
        dateFormat = 'YYYY-MM-DD';
        break;
      case '90d':
        interval = 'INTERVAL \'90 days\'';
        grouping = 'date_trunc(\'day\', al.created_at)';
        extractField = 'DAY';
        dateFormat = 'YYYY-MM-DD';
        break;
      default: // 24h
        interval = 'INTERVAL \'24 hours\'';
        grouping = 'date_trunc(\'hour\', al.created_at)';
        extractField = 'HOUR';
        dateFormat = 'YYYY-MM-DD HH24:MI:SS';
    }

    // Get login activity with timestamps for accurate date filtering
    const loginQuery = `
      WITH hourly_logins AS (
        SELECT 
          ${grouping} as time_period,
          COUNT(DISTINCT al.user_id) as count
        FROM audit_logs al
        WHERE 
          al.action = 'LOGIN'
          AND al.created_at >= NOW() - ${interval}
        GROUP BY ${grouping}
        ORDER BY time_period
      )
      SELECT 
        time_period as timestamp,
        EXTRACT(${extractField} FROM time_period)::INTEGER as hour,
        EXTRACT(DAY FROM time_period)::INTEGER as day,
        EXTRACT(MONTH FROM time_period)::INTEGER as month,
        EXTRACT(YEAR FROM time_period)::INTEGER as year,
        TO_CHAR(time_period, '${dateFormat}') as formatted_time,
        count
      FROM hourly_logins
    `;

    // Get voting activity with accurate distinct voter counting
    const votingQuery = `
      WITH hourly_votes AS (
        SELECT 
          date_trunc('${timeframe === '30d' || timeframe === '60d' || timeframe === '90d' ? 'day' : 'hour'}', v.created_at) as time_period,
          COUNT(DISTINCT v.student_id) as count
        FROM votes v
        INNER JOIN elections e ON v.election_id = e.id
        WHERE 
          v.created_at >= NOW() - ${interval}
          AND (e.is_active IS NULL OR e.is_active = TRUE)
          AND (e.is_deleted IS NULL OR e.is_deleted = FALSE)
        GROUP BY date_trunc('${timeframe === '30d' || timeframe === '60d' || timeframe === '90d' ? 'day' : 'hour'}', v.created_at)
        ORDER BY time_period
      )
      SELECT 
        time_period as timestamp,
        EXTRACT(${extractField} FROM time_period)::INTEGER as hour,
        EXTRACT(DAY FROM time_period)::INTEGER as day,
        EXTRACT(MONTH FROM time_period)::INTEGER as month,
        EXTRACT(YEAR FROM time_period)::INTEGER as year,
        TO_CHAR(time_period, '${dateFormat}') as formatted_time,
        count
      FROM hourly_votes
    `;

    // Get peak hours and counts with better timeframe handling
    const peakStatsQuery = `
      WITH login_stats AS (
        SELECT 
          EXTRACT(${extractField} FROM ${grouping})::INTEGER as hour,
          COUNT(DISTINCT al.user_id) as count
        FROM audit_logs al
        WHERE 
          al.action = 'LOGIN'
          AND al.created_at >= NOW() - ${interval}
        GROUP BY EXTRACT(${extractField} FROM ${grouping})
      ),
      vote_stats AS (
        SELECT 
          EXTRACT(${extractField} FROM date_trunc('${timeframe === '30d' || timeframe === '60d' || timeframe === '90d' ? 'day' : 'hour'}', v.created_at))::INTEGER as hour,
          COUNT(DISTINCT v.student_id) as count
        FROM votes v
        INNER JOIN elections e ON v.election_id = e.id
        WHERE 
          v.created_at >= NOW() - ${interval}
          AND (e.is_active IS NULL OR e.is_active = TRUE)
          AND (e.is_deleted IS NULL OR e.is_deleted = FALSE)
        GROUP BY EXTRACT(${extractField} FROM date_trunc('${timeframe === '30d' || timeframe === '60d' || timeframe === '90d' ? 'day' : 'hour'}', v.created_at))
      ),
      active_users AS (
        SELECT COUNT(DISTINCT al.user_id) as count
        FROM audit_logs al
        WHERE 
          al.action = 'LOGIN'
          AND al.created_at >= NOW() - ${interval}
      )
      SELECT
        (SELECT COALESCE(hour::TEXT || ':00', 'N/A') FROM login_stats ORDER BY count DESC LIMIT 1) as peak_login_hour,
        (SELECT COALESCE(count, 0) FROM login_stats ORDER BY count DESC LIMIT 1) as peak_login_count,
        (SELECT COALESCE(hour::TEXT || ':00', 'N/A') FROM vote_stats ORDER BY count DESC LIMIT 1) as peak_voting_hour,
        (SELECT COALESCE(count, 0) FROM vote_stats ORDER BY count DESC LIMIT 1) as peak_voting_count,
        (SELECT COALESCE(count, 0) FROM active_users) as total_active_users
    `;

    const [loginActivity, votingActivity, peakStats] = await Promise.all([
      pool.query(loginQuery),
      pool.query(votingQuery),
      pool.query(peakStatsQuery)
    ]);

    // Validate query results
    if (!loginActivity.rows || !votingActivity.rows || !peakStats.rows || peakStats.rows.length === 0) {
      console.warn('Warning: One or more query results are empty', {
        loginActivityRows: loginActivity?.rows?.length || 0,
        votingActivityRows: votingActivity?.rows?.length || 0,
        peakStatsRows: peakStats?.rows?.length || 0
      });
    }

    // Calculate total votes (all votes, not just distinct voters)
    const totalVotesResult = await pool.query(`
      SELECT COUNT(*) as total_votes
      FROM votes v
      INNER JOIN elections e ON v.election_id = e.id
      WHERE 
        v.created_at >= NOW() - ${interval}
        AND (e.is_active IS NULL OR e.is_active = TRUE)
        AND (e.is_deleted IS NULL OR e.is_deleted = FALSE)
    `);

    const totalVotes = parseInt(totalVotesResult?.rows?.[0]?.total_votes) || 0;

    // Transform the data with proper timestamp information
    const response = {
      summary: {
        peak_login_hour: peakStats.rows[0]?.peak_login_hour || 'N/A',
        peak_login_count: parseInt(peakStats.rows[0]?.peak_login_count) || 0,
        peak_voting_hour: peakStats.rows[0]?.peak_voting_hour || 'N/A',
        peak_voting_count: parseInt(peakStats.rows[0]?.peak_voting_count) || 0,
        total_active_users: parseInt(peakStats.rows[0]?.total_active_users) || 0,
        total_distinct_voters: votingActivity.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0),
        total_votes: totalVotes,
        timeframe: timeframe,
        generated_at: new Date().toISOString()
      },
      login_activity: loginActivity.rows.map(row => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count),
        day: parseInt(row.day),
        month: parseInt(row.month),
        year: parseInt(row.year),
        timestamp: typeof row.timestamp === 'string' ? row.timestamp : (row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString()),
        formatted_time: row.formatted_time || '',
        type: 'logins'
      })),
      voting_activity: votingActivity.rows.map(row => ({
        hour: parseInt(row.hour),
        count: parseInt(row.count),
        day: parseInt(row.day),
        month: parseInt(row.month),
        year: parseInt(row.year),
        timestamp: typeof row.timestamp === 'string' ? row.timestamp : (row.timestamp instanceof Date ? row.timestamp.toISOString() : new Date(row.timestamp).toISOString()),
        formatted_time: row.formatted_time || '',
        type: 'voters'
      }))
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in getSystemLoad:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      timeframe: req.query.timeframe
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system load data',
      details: error.message
    });
  }
};

module.exports = {
  getSystemLoad
}; 