const pool = require("../config/db");
<<<<<<< HEAD

/**
 * @param {number} adminId 
 * @returns {Array} 
=======
/**
 * Get all permissions for a specific admin
 * @param {number} adminId - The admin's user ID
 * @returns {Array} Array of permission objects by module
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
 */
const getAdminPermissions = async (adminId) => {
  try {
    const query = `
      SELECT module, can_view, can_create, can_edit, can_delete
      FROM admin_permissions
      WHERE admin_id = $1
    `;
    const result = await pool.query(query, [adminId]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching admin permissions:", error);
    throw error;
  }
};

/**
<<<<<<< HEAD

 * @param {number} adminId 
 * @param {Object} permissions 
 * @returns {boolean}
=======
 * Set permissions for a specific admin
 * @param {number} adminId - The admin's user ID
 * @param {Object} permissions - Object containing permission settings
 * @returns {boolean} Success indicator
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
 */
const setAdminPermissions = async (adminId, permissions) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM admin_permissions WHERE admin_id = $1", [adminId]);

    for (const [module, perms] of Object.entries(permissions)) {
      const query = `
        INSERT INTO admin_permissions 
        (admin_id, module, can_view, can_create, can_edit, can_delete)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(query, [
        adminId,
        module,
        perms.canView || false,
        perms.canCreate || false,
        perms.canEdit || false,
        perms.canDelete || false
      ]);
    }

    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error setting admin permissions:", error);
    throw error;
  } finally {
    client.release();
  }
};

/**
<<<<<<< HEAD

 * @param {number} adminId 
 * @param {string} module 
 * @param {string} action 
 * @returns {boolean} 
 */
const hasPermission = async (adminId, module, action) => {
  try {
=======
 * Check if an admin has a specific permission
 * @param {number} adminId - The admin's user ID
 * @param {string} module - The module name (e.g., 'users')
 * @param {string} action - The action name (view/create/edit/delete)
 * @returns {boolean} Whether the admin has permission
 */
const hasPermission = async (adminId, module, action) => {
  try {
    // Remove any existing 'can_' prefix to avoid duplication
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const cleanAction = action.replace(/^can_/, '');
    const permissionColumn = `can_${cleanAction}`;
    
    const query = `
      SELECT ${permissionColumn}
      FROM admin_permissions
      WHERE admin_id = $1 AND module = $2
    `;
    
    const result = await pool.query(query, [adminId, module]);

    return result.rows.length > 0 ? result.rows[0][permissionColumn] : false;
  } catch (error) {
    console.error("Error checking permission:", error);
    throw error;
  }
};

module.exports = {
  getAdminPermissions,
  setAdminPermissions,
  hasPermission
}; 