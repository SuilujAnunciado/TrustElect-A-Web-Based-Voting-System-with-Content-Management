const pool = require('../config/db');

/**
 * @returns {Promise<Array>} 
 */
async function getAllContent() {
  try {
    const result = await pool.query(
      `SELECT id, section_key, content_data, section_order, 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, 
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at 
       FROM landing_content 
       ORDER BY section_order ASC`
    );
    
    if (result.rows.length > 0) {
      const contentObj = {};
      
      result.rows.forEach(row => {
        contentObj[row.section_key] = row.content_data;
      });
      
      if (!contentObj.logo) {
        contentObj.logo = {
          imageUrl: null
        };
      }
      
      return contentObj;
    }
    
    return {
      logo: {
        imageUrl: null
      }
    };
  } catch (error) {
    console.error('Error in getAllContent:', error);
    throw error;
  }
}

/**
 * @param {String} sectionKey 
 * @returns {Promise<Object>} 
 */
async function getSectionContent(sectionKey) {
  try {
    const result = await pool.query(
      `SELECT id, section_key, content_data, section_order, 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at, 
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at 
       FROM landing_content 
       WHERE section_key = $1`,
      [sectionKey]
    );
    
    if (result.rows.length > 0) {
      return {
        content: result.rows[0].content_data
      };
    }
    
    const defaultContent = {
      logo: {
        imageUrl: null
      },
      hero: {
        title: "TrustElect Voting Platform",
        subtitle: "STI TrustElect Voting System",
        videoUrl: null,
        posterImage: null,
        bgColor: "#1e40af",
        textColor: "#ffffff"
      },
      features: {
        columns: [
          {
            title: "Easy Setup",
            description: "Simple election process",
            imageUrl: null,
            bgColor: "#ffffff",
            textColor: "#000000"
          },
          {
            title: "Secure Voting",
            description: "End-to-end encryption votes",
            imageUrl: null,
            bgColor: "#ffffff",
            textColor: "#000000"
          },
          {
            title: "Real-time Results",
            description: "Instant counting and results",
            imageUrl: null,
            bgColor: "#ffffff",
            textColor: "#000000"
          }
        ]
      },
      callToAction: {
        title: "Ready to Vote?",
        subtitle: "Start your experience with TrustElect.",
        buttonText: "Contact Us",
        enabled: true,
        videoUrl: null,
        bgColor: "#1e3a8a",
        textColor: "#ffffff",
        mediaType: null,
        mediaPosition: null,
        purpose: null
      },
      candidates: {
        title: "Election Candidates",
        subtitle: "Meet the candidates running in this election",
        sectionBgColor: "#f9fafb",
        textColor: "#000000",
        items: []
      }
    };

    return {
      content: defaultContent[sectionKey] || null
    };
  } catch (error) {
    console.error(`Error in getSectionContent for section ${sectionKey}:`, error);
    throw error;
  }
}

/**

 * @param {String} sectionKey 
 * @param {Object} contentData
 * @returns {Promise<Object>}
 */
async function updateSectionContent(sectionKey, contentData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE landing_content 
       SET content_data = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE section_key = $2 
       RETURNING id, section_key, content_data`,
      [contentData, sectionKey]
    );
    
    if (updateResult.rows.length === 0) {
      const orderResult = await client.query(
        `SELECT COALESCE(MAX(section_order), 0) + 1 as next_order FROM landing_content`
      );
      
      const sectionOrder = orderResult.rows[0].next_order;
      
      const insertResult = await client.query(
        `INSERT INTO landing_content (section_key, content_data, section_order) 
         VALUES ($1, $2, $3) 
         RETURNING id, section_key, content_data`,
        [sectionKey, contentData, sectionOrder]
      );
      
      await client.query('COMMIT');
      return insertResult.rows[0].content_data;
    }
    
    await client.query('COMMIT');
    return updateResult.rows[0].content_data;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in updateSectionContent for section ${sectionKey}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @param {Object} mediaData
 * @returns {Promise<Object>} 
 */
async function saveMedia(mediaData) {
  try {
    const {
      filename,
      originalFilename,
      fileType,
      mimeType,
      fileSize,
      path,
      url,
      altText = null
    } = mediaData;
    
    const result = await pool.query(
      `INSERT INTO media (
         filename, original_filename, file_type, 
         mime_type, file_size, path, url, alt_text
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, filename, original_filename as originalFilename, 
                 file_type as fileType, mime_type as mimeType, 
                 file_size as fileSize, path, url, 
                 alt_text as altText, 
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as createdAt`,
      [
        filename,
        originalFilename,
        fileType,
        mimeType,
        fileSize,
        path,
        url,
        altText
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in saveMedia:', error);
    throw error;
  }
}

/**
 * @param {Number} id 
 * @returns {Promise<Object>} 
 */
async function getMediaById(id) {
  try {
    const result = await pool.query(
      `SELECT id, filename, original_filename as "originalFilename", 
              file_type as "fileType", mime_type as "mimeType", 
              file_size as "fileSize", path, url, alt_text as "altText", 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt" 
       FROM media 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error in getMediaById for ID ${id}:`, error);
    throw error;
  }
}

/**
 * @param {String} fileType 
 * @returns {Promise<Array>} 
 */
async function getAllMedia(fileType = null) {
  try {
    let query = `
      SELECT id, filename, original_filename as "originalFilename", 
             file_type as "fileType", mime_type as "mimeType", 
             file_size as "fileSize", path, url, alt_text as "altText", 
             to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt" 
      FROM media
    `;
    
    const params = [];
    
    if (fileType) {
      query += ` WHERE file_type = $1`;
      params.push(fileType);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error in getAllMedia:', error);
    throw error;
  }
}

/**
 * @param {Number} id 
 * @returns {Promise<Boolean>} 
 */
async function deleteMedia(id) {
  try {
    const result = await pool.query(
      `DELETE FROM media WHERE id = $1 RETURNING id`,
      [id]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error in deleteMedia for ID ${id}:`, error);
    throw error;
  }
}

/**
 * @returns {Promise<Object>}
 */
async function getActiveTheme() {
  try {
    const result = await pool.query(
      `SELECT id, name, colors, 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt" 
       FROM themes 
       WHERE is_active = TRUE 
       LIMIT 1`
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    const defaultResult = await pool.query(
      `SELECT id, name, colors, 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt" 
       FROM themes 
       ORDER BY id ASC 
       LIMIT 1`
    );
    
    if (defaultResult.rows.length > 0) {
      return defaultResult.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error in getActiveTheme:', error);
    throw error;
  }
}

/**
 * @param {Number} themeId 
 * @returns {Promise<Object>}
 */
async function setActiveTheme(themeId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE themes SET is_active = FALSE`
    );
    
    const result = await client.query(
      `UPDATE themes 
       SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING id, name, colors, 
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
                 to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt"`,
      [themeId]
    );
    
    await client.query('COMMIT');
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in setActiveTheme for ID ${themeId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @param {String} name 
 * @param {Object} colors 
 * @param {Boolean} isActive 
 * @returns {Promise<Object>} 
 */
async function createTheme(name, colors, isActive = false) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    if (isActive) {
      await client.query(
        `UPDATE themes SET is_active = FALSE`
      );
    }
    
    const result = await client.query(
      `INSERT INTO themes (name, colors, is_active) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, colors, is_active as "isActive", 
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
                 to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt"`,
      [name, colors, isActive]
    );
    
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in createTheme:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * @returns {Promise<Array>} 
 */
async function getAllThemes() {
  try {
    const result = await pool.query(
      `SELECT id, name, colors, is_active as "isActive", 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt" 
       FROM themes 
       ORDER BY name ASC`
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error in getAllThemes:', error);
    throw error;
  }
}

/**

 * @param {Number} id 
 * @returns {Promise<Object>} 
 */
async function getThemeById(id) {
  try {
    const result = await pool.query(
      `SELECT id, name, colors, is_active as "isActive", 
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt" 
       FROM themes 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error in getThemeById for ID ${id}:`, error);
    throw error;
  }
}

/**
 
 * @param {Number} id 
 * @param {String} name
 * @param {Object} colors 
 * @returns {Promise<Object>}
 */
async function updateTheme(id, name, colors) {
  try {
    const result = await pool.query(
      `UPDATE themes 
       SET name = $1, colors = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, name, colors, is_active as "isActive", 
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as "createdAt", 
                 to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS') as "updatedAt"`,
      [name, colors, id]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error in updateTheme for ID ${id}:`, error);
    throw error;
  }
}

/**
 * @param {Number} id
 * @returns {Promise<Boolean>} 
 */
async function deleteTheme(id) {
  try {
    const countResult = await pool.query('SELECT COUNT(*) FROM themes');
    if (parseInt(countResult.rows[0].count) <= 1) {
      throw new Error('Cannot delete the last theme');
    }
    
    const themeResult = await pool.query(
      'SELECT is_active FROM themes WHERE id = $1',
      [id]
    );
    
    if (themeResult.rows.length > 0 && themeResult.rows[0].is_active) {
      const otherThemeResult = await pool.query(
        'SELECT id FROM themes WHERE id != $1 LIMIT 1',
        [id]
      );
      
      if (otherThemeResult.rows.length > 0) {
        await setActiveTheme(otherThemeResult.rows[0].id);
      }
    }

    const result = await pool.query(
      'DELETE FROM themes WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error in deleteTheme for ID ${id}:`, error);
    throw error;
  }
}

module.exports = {
  getAllContent,
  getSectionContent,
  updateSectionContent,
  saveMedia,
  getMediaById,
  getAllMedia,
  deleteMedia,
  getActiveTheme,
  setActiveTheme,
  createTheme,
  getAllThemes,
  getThemeById,
  updateTheme,
  deleteTheme
}; 