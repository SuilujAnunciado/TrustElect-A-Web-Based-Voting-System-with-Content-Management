const pool = require("../config/db");

const getAcademicTerms = async () => {
  try {
    const query = `
      SELECT 
        at.id,
        at.school_year,
        at.term,
        at.is_current,
        at.is_active,
        at.created_at,
        at.updated_at,
        COALESCE(stats.total_students, 0) AS student_count
      FROM academic_terms at
      LEFT JOIN (
        SELECT academic_term_id, COUNT(*) AS total_students
        FROM students
        WHERE is_active = TRUE
        GROUP BY academic_term_id
      ) stats ON stats.academic_term_id = at.id
      ORDER BY at.is_current DESC, at.school_year DESC, at.term ASC, at.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('permission denied')) {
      throw new Error('Academic terms table does not exist. Please run the migration: node src/migrations/apply_academic_terms.js');
    }
    throw error;
  }
};

const getAcademicTermById = async (id) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM academic_terms WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('permission denied')) {
      throw new Error('Academic terms table does not exist or access denied. Please check database permissions.');
    }
    throw error;
  }
};

const getCurrentAcademicTerm = async () => {
  try {
    const current = await pool.query(
      `
        SELECT * 
        FROM academic_terms 
        WHERE is_current = TRUE
        ORDER BY updated_at DESC
        LIMIT 1
      `
    );

    if (current.rows.length > 0) {
      return current.rows[0];
    }

    const fallback = await pool.query(
      `
        SELECT * 
        FROM academic_terms 
        ORDER BY created_at DESC
        LIMIT 1
      `
    );

    return fallback.rows[0] || null;
  } catch (error) {
    if (error.message.includes('does not exist') || error.message.includes('permission denied')) {
      throw new Error('Academic terms table does not exist. Please run the migration: node src/migrations/apply_academic_terms.js');
    }
    throw error;
  }
};

const ensureAcademicTermId = async (academicTermId) => {
  if (academicTermId) {
    const existing = await getAcademicTermById(academicTermId);
    if (!existing) {
      throw new Error("Selected academic term was not found.");
    }
    return existing.id;
  }

  const current = await getCurrentAcademicTerm();
  if (!current) {
    throw new Error("No academic term is configured. Please create one first.");
  }

  return current.id;
};

const createAcademicTerm = async ({ schoolYear, term, isCurrent = false }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query(
      `
        SELECT 1 FROM academic_terms 
        WHERE LOWER(school_year) = LOWER($1) 
          AND LOWER(term) = LOWER($2)
      `,
      [schoolYear, term]
    );

    if (exists.rows.length > 0) {
      throw new Error("An academic term with the same school year and term already exists.");
    }

    if (isCurrent) {
      await client.query(`UPDATE academic_terms SET is_current = FALSE`);
    }

    const insertResult = await client.query(
      `
        INSERT INTO academic_terms (school_year, term, is_current)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [schoolYear, term, isCurrent]
    );

    await client.query("COMMIT");
    return insertResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateAcademicTerm = async (id, { schoolYear, term, isCurrent, isActive }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await getAcademicTermById(id);
    if (!existing) {
      throw new Error("Academic term not found.");
    }

    if (
      (schoolYear && schoolYear.toLowerCase() !== existing.school_year.toLowerCase()) ||
      (term && term.toLowerCase() !== existing.term.toLowerCase())
    ) {
      const duplicateCheck = await client.query(
        `
          SELECT 1 FROM academic_terms 
          WHERE LOWER(school_year) = LOWER($1) 
            AND LOWER(term) = LOWER($2)
            AND id <> $3
        `,
        [schoolYear || existing.school_year, term || existing.term, id]
      );

      if (duplicateCheck.rows.length > 0) {
        throw new Error("Another academic term already uses that school year and term.");
      }
    }

    if (isCurrent === true) {
      await client.query(`UPDATE academic_terms SET is_current = FALSE WHERE id <> $1`, [id]);
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (schoolYear !== undefined) {
      fields.push(`school_year = $${paramIndex++}`);
      values.push(schoolYear);
    }
    if (term !== undefined) {
      fields.push(`term = $${paramIndex++}`);
      values.push(term);
    }
    if (isCurrent !== undefined) {
      fields.push(`is_current = $${paramIndex++}`);
      values.push(isCurrent);
    }
    if (isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    if (fields.length === 0) {
      await client.query("ROLLBACK");
      return existing;
    }

    values.push(id);

    const updateResult = await client.query(
      `
        UPDATE academic_terms
        SET ${fields.join(", ")}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values
    );

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAcademicTerms,
  getAcademicTermById,
  getCurrentAcademicTerm,
  ensureAcademicTermId,
  createAcademicTerm,
  updateAcademicTerm
};

