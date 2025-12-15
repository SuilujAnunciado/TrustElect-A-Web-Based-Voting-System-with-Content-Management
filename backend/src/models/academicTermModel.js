const pool = require("../config/db");

<<<<<<< HEAD

=======
/**
 * Get all academic terms
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
/**
 * Get the current academic term
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
/**
 * Get academic term by ID
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
/**
 * Create a new academic term
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const createAcademicTerm = async (schoolYear, term, isCurrent = false) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

<<<<<<< HEAD
=======
    // If this is marked as current, unset all other current terms
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (isCurrent) {
      await client.query(`
        UPDATE academic_terms 
        SET is_current = FALSE 
        WHERE is_current = TRUE
      `);
    }

<<<<<<< HEAD
=======
    // Check if this combination already exists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
/**
 * Update an academic term
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
/**
 * Set an academic term as current (and unset others)
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const setCurrentAcademicTerm = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

<<<<<<< HEAD
=======
    // Check if the term exists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const termCheck = await client.query(
      'SELECT id FROM academic_terms WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (termCheck.rows.length === 0) {
      throw new Error('Academic term not found or inactive');
    }

<<<<<<< HEAD
    await client.query('UPDATE academic_terms SET is_current = FALSE');

=======
    // Unset all current terms
    await client.query('UPDATE academic_terms SET is_current = FALSE');

    // Set the specified term as current
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD

=======
/**
 * Soft delete an academic term (set is_active to false)
 * Only allowed if no students are associated with this term
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
const deleteAcademicTerm = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

<<<<<<< HEAD
=======
    // Check if any students are associated with this term
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const studentCheck = await client.query(
      'SELECT COUNT(*) as count FROM students WHERE academic_term_id = $1',
      [id]
    );

    if (parseInt(studentCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete academic term: students are enrolled in this term');
    }

<<<<<<< HEAD
=======
    // Check if this is the current term
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
    // Soft delete
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

<<<<<<< HEAD
=======
/**
 * Get student count per academic term
 */
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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

