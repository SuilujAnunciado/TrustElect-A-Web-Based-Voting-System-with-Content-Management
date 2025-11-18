const pool = require("../config/db");

const getAllLaboratoryPrecincts = async () => {
  const result = await pool.query(`
    WITH ip_data AS (
      SELECT
        laboratory_precinct_id,
        COUNT(*) FILTER (WHERE is_active = TRUE) AS active_ip_count,
        ARRAY_AGG(
          CASE 
            WHEN ip_type = 'range' THEN ip_range_start || ' - ' || ip_range_end
            WHEN ip_type = 'subnet' THEN subnet_mask
            ELSE ip_address
          END
        ) FILTER (WHERE is_active = TRUE) AS active_ips
      FROM laboratory_ip_addresses
      GROUP BY laboratory_precinct_id
    ),
    active_laboratories AS (
      SELECT
        elp.laboratory_precinct_id,
        COUNT(DISTINCT e.id) AS active_election_count,
        ARRAY_AGG(DISTINCT e.title) AS active_election_titles
      FROM election_laboratory_precincts elp
      JOIN elections e ON e.id = elp.election_id
      WHERE e.status = 'ongoing'
      GROUP BY elp.laboratory_precinct_id
    )
    SELECT 
      p.id,
      p.name,
      p.name as description,
      COALESCE(ip_data.active_ip_count, 0) as ip_count,
      COALESCE(ip_data.active_ips, ARRAY[]::text[]) as active_ips,
      COALESCE(active_laboratories.active_election_count, 0) as active_election_count,
      COALESCE(active_laboratories.active_election_titles, ARRAY[]::text[]) as active_election_titles
    FROM precincts p
    LEFT JOIN ip_data ON ip_data.laboratory_precinct_id = p.id
    LEFT JOIN active_laboratories ON active_laboratories.laboratory_precinct_id = p.id
    ORDER BY p.name
  `);
  return result.rows;
};

const getLaboratoryPrecinctById = async (id) => {
  const result = await pool.query(`
    SELECT 
      p.id,
      p.name,
      p.name as description,
      lia.id as ip_id,
      lia.ip_address,
      lia.ip_type,
      lia.ip_range_start,
      lia.ip_range_end,
      lia.subnet_mask,
      lia.is_active as ip_active,
      lia.created_at as ip_created_at
    FROM precincts p
    LEFT JOIN laboratory_ip_addresses lia ON p.id = lia.laboratory_precinct_id AND lia.is_active = TRUE
    WHERE p.id = $1
    ORDER BY lia.created_at
  `, [id]);
  return result.rows;
};

const addIPAddress = async (laboratoryPrecinctId, ipData) => {
  const { ip_address, ip_type, ip_range_start, ip_range_end, subnet_mask } = ipData;
  
  const result = await pool.query(`
    INSERT INTO laboratory_ip_addresses 
    (laboratory_precinct_id, ip_address, ip_type, ip_range_start, ip_range_end, subnet_mask)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
  `, [laboratoryPrecinctId, ip_address, ip_type, ip_range_start, ip_range_end, subnet_mask]);
  
  return result.rows[0];
};

const updateIPAddress = async (ipId, ipData) => {
  const { ip_address, ip_type, ip_range_start, ip_range_end, subnet_mask, is_active } = ipData;
  
  const result = await pool.query(`
    UPDATE laboratory_ip_addresses 
    SET ip_address = $1, ip_type = $2, ip_range_start = $3, 
        ip_range_end = $4, subnet_mask = $5, is_active = $6
    WHERE id = $7 RETURNING *
  `, [ip_address, ip_type, ip_range_start, ip_range_end, subnet_mask, is_active, ipId]);
  
  return result.rows[0];
};

const deleteIPAddress = async (ipId) => {
  const result = await pool.query(`
    DELETE FROM laboratory_ip_addresses 
    WHERE id = $1 RETURNING *
  `, [ipId]);
  return result.rows[0];
};

const validateStudentVotingIP = async (studentId, electionId, clientIP) => {
  const result = await pool.query(
    'SELECT public.validate_student_voting_ip($1, $2, $3) as is_valid',
    [studentId, electionId, clientIP]
  );
  return result.rows[0].is_valid;
};

const getStudentLaboratoryAssignment = async (studentId, electionId) => {
  const result = await pool.query(`
    SELECT 
      p.id as laboratory_precinct_id,
      p.name as laboratory_name,
      epp.programs as assigned_courses
    FROM students s
    JOIN election_precinct_programs epp ON epp.programs @> ARRAY[s.course_name::text]
    JOIN precincts p ON p.name = epp.precinct
    WHERE s.id = $1 AND epp.election_id = $2
    LIMIT 1
  `, [studentId, electionId]);
  
  return result.rows[0] || null;
};

const createElectionLaboratoryPrecincts = async (electionId, laboratoryPrecincts) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing laboratory precincts for this election
    await client.query(
      'DELETE FROM election_laboratory_precincts WHERE election_id = $1',
      [electionId]
    );
    
    // Insert new laboratory precincts
    for (const labPrecinct of laboratoryPrecincts) {
      if (labPrecinct.assignedCourses && labPrecinct.assignedCourses.length > 0) {
        await client.query(
          `INSERT INTO election_laboratory_precincts 
           (election_id, laboratory_precinct_id, assigned_courses) 
           VALUES ($1, $2, $3)`,
          [electionId, labPrecinct.laboratoryPrecinctId, labPrecinct.assignedCourses]
        );
      }
    }
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const assignStudentsToLaboratoryPrecincts = async (electionId, laboratoryPrecincts) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get all eligible voters for this election
    const eligibleVoters = await client.query(
      'SELECT * FROM eligible_voters WHERE election_id = $1',
      [electionId]
    );
    
    // Assign each student to appropriate laboratory precinct
    for (const voter of eligibleVoters.rows) {
      for (const labPrecinct of laboratoryPrecincts) {
        if (labPrecinct.assignedCourses.includes(voter.course_name)) {
          // Get the election_laboratory_precinct_id
          const elpResult = await client.query(
            'SELECT id FROM election_laboratory_precincts WHERE election_id = $1 AND laboratory_precinct_id = $2',
            [electionId, labPrecinct.laboratoryPrecinctId]
          );
          
          if (elpResult.rows.length > 0) {
            // Update eligible_voters with laboratory assignment
            await client.query(
              'UPDATE eligible_voters SET election_laboratory_precinct_id = $1 WHERE id = $2',
              [elpResult.rows[0].id, voter.id]
            );
            break; // Student assigned to first matching lab
          }
        }
      }
    }
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllLaboratoryPrecincts,
  getLaboratoryPrecinctById,
  addIPAddress,
  updateIPAddress,
  deleteIPAddress,
  validateStudentVotingIP,
  getStudentLaboratoryAssignment,
  createElectionLaboratoryPrecincts,
  assignStudentsToLaboratoryPrecincts
};
