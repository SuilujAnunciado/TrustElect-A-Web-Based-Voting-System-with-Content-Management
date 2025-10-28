const validateVotingIP = async (req, res, next) => {
  try {
    const studentId = req.user?.studentId;
    const electionId = req.params?.id;
    
    // Get client IP
    let clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   req.headers['x-real-ip'] ||
                   req.connection.remoteAddress ||
                   req.socket.remoteAddress ||
                   req.ip ||
                   req.ips?.[0];
    
    // Clean IPv6-mapped IPv4 addresses
    if (clientIP && clientIP.startsWith('::ffff:')) {
      clientIP = clientIP.substring(7);
    }
    
    // Handle localhost variations
    if (clientIP === '::1') {
      clientIP = '127.0.0.1';
    }
    
    // Validate required parameters
    if (!studentId || !electionId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Election ID are required for IP validation'
      });
    }

    const { pool } = require('../config/db');
    
    // Check if IP validation tables exist
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'election_precinct_programs'
      ) as table_exists
    `);
    
    if (!tableCheck.rows[0].table_exists) {
      return next();
    }
    
    // Check if there are any election-precinct assignments
    const assignmentCount = await pool.query('SELECT COUNT(*) as count FROM election_precinct_programs');
    
    if (assignmentCount.rows[0].count === 0) {
      return next();
    }
    
    // Check if student is assigned to any precinct(s) for this election
    const studentAssignment = await pool.query(`
      SELECT 
        s.course_name,
        epp.precinct,
        p.id as precinct_id,
        p.name as precinct_name
      FROM students s
      JOIN election_precinct_programs epp ON epp.programs @> ARRAY[s.course_name::text]
      JOIN precincts p ON p.name = epp.precinct
      WHERE s.id = $1 AND epp.election_id = $2
    `, [studentId, electionId]);
    
    // If no assignment found, deny access
    if (studentAssignment.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not assigned to any laboratory for this election. Please contact your election administrator.'
      });
    }
    
    // Build list of assigned precinct IDs and names
    const assignedPrecincts = studentAssignment.rows.map(r => ({ id: r.precinct_id, name: r.precinct_name }));
    const assignedPrecinctIds = assignedPrecincts.map(p => p.id);
    const assignedNames = assignedPrecincts.map(p => p.name);

    // Load all active IP addresses for all assigned precincts
    const ipCheck = await pool.query(`
      SELECT laboratory_precinct_id, ip_address, ip_type
      FROM laboratory_ip_addresses
      WHERE laboratory_precinct_id = ANY($1::int[])
      AND is_active = true
    `, [assignedPrecinctIds]);
    
    // If no IP addresses registered for any assigned precincts, deny
    if (ipCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: `Access denied. No IP addresses are registered for your assigned laboratories: ${assignedNames.join(', ')}. Please contact your election administrator.`
      });
    }
    
    let ipMatch = false;
    const possibleIPs = [
      clientIP,
      req.ip,
      req.connection.remoteAddress,
      req.socket.remoteAddress,
      req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      req.headers['x-real-ip']
    ].filter(ip => ip && ip !== '::1');
    
    for (const ipRecord of ipCheck.rows) {
      const registeredIP = ipRecord.ip_address;
      
      for (const possibleIP of possibleIPs) {
        // Clean the possible IP
        let cleanIP = possibleIP;
        if (cleanIP && cleanIP.startsWith('::ffff:')) {
          cleanIP = cleanIP.substring(7);
        }
        if (cleanIP === '::1') {
          cleanIP = '127.0.0.1';
        }
        
        // Check for exact match
        if (registeredIP === cleanIP) {
          ipMatch = true;
          break;
        }
      }
      
      if (ipMatch) break;
    }
    
    if (!ipMatch) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only vote from your assigned laboratories: ${assignedNames.join(', ')}. Please go to any of the designated laboratories to cast your vote.`
      });
    }
    
    next();
    
  } catch (error) {
    // In case of error, deny access for security
    return res.status(500).json({
      success: false,
      message: 'IP validation error. Please contact your election administrator.'
    });
  }
};

module.exports = { validateVotingIP };