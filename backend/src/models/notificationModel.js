const pool = require("../config/db");


/**
 * @param {Object} notification 
 * @returns {Promise<Object>} 
 */
const createNotification = async (notification) => {
  const { user_id, role, title, message, type, related_entity, entity_id } = notification;
  
  const query = `
    INSERT INTO notifications 
    (user_id, role, title, message, type, related_entity, entity_id) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *
  `;
  
  const values = [user_id, role, title, message, type, related_entity, entity_id];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 
 * @param {Array} userIds 
 * @param {String} role 
 * @param {String} title 
 * @param {String} message 
 * @param {String} type 
 * @param {String} related_entity 
 * @param {Number} entity_id 
 * @returns {Promise<Array>} 
 */
const createNotificationForUsers = async (userIds, role, title, message, type, related_entity, entity_id) => {
 
  const values = [];
  const placeholders = [];
  
  userIds.forEach((userId, index) => {
    const offset = index * 7;
    values.push(userId, role, title, message, type, related_entity, entity_id);
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`);
  });
  
  const query = `
    INSERT INTO notifications 
    (user_id, role, title, message, type, related_entity, entity_id) 
    VALUES ${placeholders.join(', ')} 
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * @param {Number} userId 
 * @param {Object} options 
 * @returns {Promise<Array>} 
 */
const getNotificationsByUser = async (userId, options = {}) => {
  const { 
    limit = 10, 
    offset = 0, 
    isRead, 
    includeRoleVariants = true 
  } = options;
  
  const userIdInt = parseInt(userId, 10);
  const limitInt = parseInt(limit, 10);
  const offsetInt = parseInt(offset, 10);
 
  
  let userRole = '';
  let roleVariants = [];
  
  if (includeRoleVariants) {
    try {
      
      const userDirectQuery = await pool.query(
        'SELECT role_id FROM users WHERE id = $1',
        [userIdInt]
      );
      
      if (userDirectQuery.rows.length > 0) {
        const user = userDirectQuery.rows[0];
        
        if (user.role_id) {
          switch (user.role_id) {
            case 1:
              userRole = 'Super Admin';
              break;
            case 2:
              userRole = 'Admin';
              break;
            case 3:
              userRole = 'Student';
              break;
            default:
              userRole = 'Unknown';
          }
        }

        if (userRole.toLowerCase().includes('super') && userRole.toLowerCase().includes('admin')) {
          roleVariants = ['Super Admin', 'SuperAdmin', 'super admin', 'superadmin', 'super_admin', 'SUPER ADMIN', 'Superadmin'];
        } else if (userRole.toLowerCase() === 'admin') {
          roleVariants = ['Admin', 'admin', 'ADMIN'];
        } else if (userRole.toLowerCase() === 'student') {
          roleVariants = ['Student', 'student', 'STUDENT'];
        }
        
      
      } else {
        console.warn(`No user found with ID ${userIdInt} in users table`);
        
        const queries = [
       
          pool.query('SELECT 1 FROM superadmins WHERE id = $1', [userIdInt]),
        
          pool.query('SELECT 1 FROM admins WHERE id = $1', [userIdInt]),
         
          pool.query('SELECT 1 FROM students WHERE id = $1', [userIdInt])
        ];
        
        const [superadminResult, adminResult, studentResult] = await Promise.allSettled(queries);
        
        if (superadminResult.status === 'fulfilled' && superadminResult.value.rows.length > 0) {
          userRole = 'Super Admin';
          roleVariants = ['Super Admin', 'SuperAdmin', 'super admin', 'superadmin', 'super_admin', 'SUPER ADMIN', 'Superadmin'];
        
        } else if (adminResult.status === 'fulfilled' && adminResult.value.rows.length > 0) {
          userRole = 'Admin';
          roleVariants = ['Admin', 'admin', 'ADMIN'];
         
        } else if (studentResult.status === 'fulfilled' && studentResult.value.rows.length > 0) {
          userRole = 'Student';
          roleVariants = ['Student', 'student', 'STUDENT'];
          
        }
      }
    } catch (error) {
      console.error('Error finding user role for variants:', error);
    }
  }
  
  try {

    let isSuperadminFix = false;
    if (roleVariants.some(v => v.toLowerCase().includes('super'))) {
      isSuperadminFix = true;
    }
    
  
    let query, queryParams, result;
    
    if (isSuperadminFix) {

      query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      queryParams = [userIdInt, limitInt, offsetInt];
      
    }

    else if (isRead === undefined && roleVariants.length === 0) {
      query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      queryParams = [userIdInt, limitInt, offsetInt];

    }
    else if (isRead !== undefined && roleVariants.length === 0) {
      query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 AND is_read = $2
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `;
      queryParams = [userIdInt, !!isRead, limitInt, offsetInt];
      
     
    }
    else if (isRead === undefined && roleVariants.length > 0) {
      query = `
        SELECT * FROM notifications 
        WHERE user_id = $1 OR (user_id = $1 AND role = ANY($2))
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
      `;
      queryParams = [userIdInt, roleVariants, limitInt, offsetInt];
      
      
    }
    else {
      query = `
        SELECT * FROM notifications 
        WHERE (user_id = $1 AND is_read = $2) OR (user_id = $1 AND role = ANY($3) AND is_read = $2)
        ORDER BY created_at DESC
        LIMIT $4 OFFSET $5
      `;
      queryParams = [userIdInt, !!isRead, roleVariants, limitInt, offsetInt];
      

    }
      
    result = await pool.query(query, queryParams);
      
    if (result.rows.length === 0 && isSuperadminFix) {
      console.log('No notifications found with standard query, trying direct role-based search...');
      
 
      const directQuery = `
        SELECT * FROM notifications 
        WHERE role IN ('Super Admin', 'SuperAdmin', 'superadmin')
        ORDER BY created_at DESC
        LIMIT 50
      `;
      
      const directResult = await pool.query(directQuery);
      
      if (directResult.rows.length > 0) {

        const updatePromises = directResult.rows.map(notification => 
          pool.query(
            'UPDATE notifications SET user_id = $1 WHERE id = $2 RETURNING *',
            [userIdInt, notification.id]
          )
        );
        
        await Promise.all(updatePromises);

        result = await pool.query(query, queryParams);
       
      }
    }

    if (result.rows.length === 0 && process.env.NODE_ENV !== 'production') {

      try {
        await pool.query(
          `INSERT INTO notifications 
           (user_id, role, title, message, type, related_entity, entity_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userIdInt, userRole || 'Unknown', 
           'Debug Notification', 
           'This is a test notification because you had no notifications.', 
           'info', null, null]
        );

        result = await pool.query(query, queryParams);
      } catch (debugError) {
        console.error('Error creating debug notification:', debugError);
      }
    }

    if (result.rows.length > 0) {
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error executing notification query:', error);
    console.error(error.stack);
    throw error;
  }
};

/**
 * @param {Number} userId 
 * @returns {Promise<Number>} 
 */
const countUnreadNotifications = async (userId) => {
  const query = `
    SELECT COUNT(*) FROM notifications 
    WHERE user_id = $1 AND is_read = FALSE
  `;
  
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count, 10);
};

/**
 * @param {Number} notificationId 
 * @param {Number} userId 
 * @returns {Promise<Object>}
 */
const markNotificationAsRead = async (notificationId, userId) => {
  const query = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE id = $1 AND user_id = $2 
    RETURNING *
  `;
  
  const result = await pool.query(query, [notificationId, userId]);
  return result.rows[0];
};

/**
 * @param {Number} userId
 * @returns {Promise<Number>} 
 */
const markAllNotificationsAsRead = async (userId) => {
  const query = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE user_id = $1 AND is_read = FALSE 
    RETURNING id
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows.length;
};

/**

 * @param {Number} notificationId
 * @param {Number} userId 
 * @returns {Promise<Boolean>} 
 */
const deleteNotification = async (notificationId, userId) => {
  const query = `
    DELETE FROM notifications 
    WHERE id = $1 AND user_id = $2 
    RETURNING id
  `;
  
  const result = await pool.query(query, [notificationId, userId]);
  return result.rows.length > 0;
};

/**
 * @param {Number} userId 
 * @returns {Promise<Number>} 
 */
const deleteAllNotifications = async (userId) => {
  const query = `
    DELETE FROM notifications 
    WHERE user_id = $1 
    RETURNING id
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows.length;
};

/**
 * @param {String} role 
 * @returns {Promise<Array>} 
 */
const debugGetNotificationsByRole = async (role) => {
  try {
   
    const query = `
      SELECT * FROM notifications 
      WHERE role = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query, [role]);

    
    if (result.rows.length > 0) {
   
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error in debugGetNotificationsByRole:', error);
    return [];
  }
};

/**
 * @param {Number} userId 
 * @param {String} entityType 
 * @param {Number} entityId 
 * @returns {Promise<Number>} 
 */
const markNotificationsByEntityAsRead = async (userId, entityType, entityId) => {
  const query = `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE user_id = $1 
    AND related_entity = $2 
    AND entity_id = $3 
    AND is_read = FALSE 
    RETURNING id
  `;
  
  const result = await pool.query(query, [userId, entityType, entityId]);
  return result.rows.length;
};

module.exports = {
  createNotification,
  createNotificationForUsers,
  getNotificationsByUser,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  debugGetNotificationsByRole,
  markNotificationsByEntityAsRead
}; 