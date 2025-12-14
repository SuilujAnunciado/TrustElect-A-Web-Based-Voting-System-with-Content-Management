const pool = require("../config/db");

const getAllAcademicTerms = async () => {
  const query = `
    SELECT 
      id, 
      school_year, 
      term, 
      is_current, 
      is_active,
      created_at,
      updated_at
    FROM academic_terms
    WHERE is_active = TRUE
    ORDER BY school_year DESC, term ASC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

const getCurrentAcademicTerm = async () => {
  const query = `
    SELECT 
      id, 
      school_year, 
      term, 
      is_current, 
      is_active,
      created_at,
      updated_at
    FROM academic_terms
    WHERE is_current = TRUE AND is_active = TRUE
    LIMIT 1;
  `;
  const result = await pool.query(query);
  return result.rows[0] || null;
};

const getAcademicTermById = async (id) => {
  const query = `
    SELECT 
      id, 
      school_year, 
      term, 
      is_current, 
      is_active,
      created_at,
      updated_at
    FROM academic_terms
    WHERE id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

const createAcademicTerm = async (schoolYear, term, isCurrent = false) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isCurrent) {
      await client.query(`
        UPDATE academic_terms 
        SET is_current = FALSE 
        WHERE is_current = TRUE
      `);
    }

    const existingCheck = await client.query(`
      SELECT id FROM academic_terms 
      WHERE LOWER(school_year) = LOWER($1) AND LOWER(term) = LOWER($2)
    `, [schoolYear, term]);

    if (existingCheck.rows.length > 0) {
      throw new Error('This academic term already exists');
    }

    const query = `
      INSERT INTO academic_terms (school_year, term, is_current, is_active)
      VALUES ($1, $2, $3, TRUE)
      RETURNING id, school_year, term, is_current, is_active, created_at, updated_at;
    `;
    const result = await client.query(query, [schoolYear, term, isCurrent]);
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateAcademicTerm = async (id, schoolYear, term) => {
  const query = `
    UPDATE academic_terms
    SET school_year = $1, term = $2, updated_at = NOW()
    WHERE id = $3
    RETURNING id, school_year, term, is_current, is_active, created_at, updated_at;
  `;
  const result = await pool.query(query, [schoolYear, term, id]);
  
  if (result.rows.length === 0) {
    throw new Error('Academic term not found');
  }
  
  return result.rows[0];
};

const setCurrentAcademicTerm = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const termCheck = await client.query(
      'SELECT id FROM academic_terms WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (termCheck.rows.length === 0) {
      throw new Error('Academic term not found or inactive');
    }

    await client.query('UPDATE academic_terms SET is_current = FALSE');

    const result = await client.query(`
      UPDATE academic_terms
      SET is_current = TRUE, updated_at = NOW()
      WHERE id = $1
      RETURNING id, school_year, term, is_current, is_active, created_at, updated_at;
    `, [id]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


const deleteAcademicTerm = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const studentCheck = await client.query(
      'SELECT COUNT(*) as count FROM students WHERE academic_term_id = $1',
      [id]
    );

    if (parseInt(studentCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete academic term: students are enrolled in this term');
    }

    const currentCheck = await client.query(
      'SELECT is_current FROM academic_terms WHERE id = $1',
      [id]
    );

    if (currentCheck.rows.length === 0) {
      throw new Error('Academic term not found');
    }

    if (currentCheck.rows[0].is_current) {
      throw new Error('Cannot delete the current academic term');
    }

    const result = await client.query(`
      UPDATE academic_terms
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `, [id]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getStudentCountByTerm = async (termId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM students
    WHERE academic_term_id = $1 AND is_active = TRUE;
  `;
  const result = await pool.query(query, [termId]);
  return parseInt(result.rows[0].count);
};

module.exports = {
  getAllAcademicTerms,
  getCurrentAcademicTerm,
  getAcademicTermById,
  createAcademicTerm,
  updateAcademicTerm,
  setCurrentAcademicTerm,
  deleteAcademicTerm,
  getStudentCountByTerm
};

