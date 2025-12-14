const pool = require('../config/db');


exports.resetSystemLoadData = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_load_logs'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      await client.query('DELETE FROM system_load_logs WHERE activity_type = $1', ['login']);
      
      await client.query('DELETE FROM system_load_logs WHERE activity_type = $1', ['voting']);

      await client.query('DELETE FROM system_load_logs');
    } 
    
    const cacheTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_cache'
      );
    `);
    
    if (cacheTableExists.rows[0].exists) {
      await client.query(`
        DELETE FROM system_cache 
        WHERE cache_key LIKE 'system_load_%' OR cache_key LIKE 'peak_hours_%'
      `);
    } 
    

    try {
      await client.query(`
        DELETE FROM audit_logs 
        WHERE action LIKE '%system_load%' OR action LIKE '%system load%'
      `);
    } catch (auditError) {

    }
    
    await client.query('COMMIT');

    
    res.status(200).json({
      success: true,
      message: 'System load data has been reset successfully',
      timestamp: new Date().toISOString(),
      resetData: {
        systemLogs: tableExists.rows[0].exists ? 'cleared' : 'table_not_found',
        cache: cacheTableExists.rows[0].exists ? 'cleared' : 'table_not_found',
        auditLogs: 'attempted'
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting system load data:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to reset system load data',
      error: error.message
    });
  } finally {
    client.release();
  }
};


exports.getResetStatus = async (req, res) => {
  try {
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_load_logs'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      return res.status(200).json({
        success: true,
        data: {
          totalLogs: 0,
          loginLogs: 0,
          votingLogs: 0,
          latestLog: null,
          isEmpty: true,
          tableExists: false
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(CASE WHEN activity_type = 'login' THEN 1 END) as login_logs,
        COUNT(CASE WHEN activity_type = 'voting' THEN 1 END) as voting_logs,
        MAX(created_at) as latest_log
      FROM system_load_logs
    `);
    
    const data = result.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        totalLogs: parseInt(data.total_logs),
        loginLogs: parseInt(data.login_logs),
        votingLogs: parseInt(data.voting_logs),
        latestLog: data.latest_log,
        isEmpty: parseInt(data.total_logs) === 0,
        tableExists: true
      }
    });
    
  } catch (error) {
    console.error('Error getting reset status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reset status',
      error: error.message
    });
  }
};
