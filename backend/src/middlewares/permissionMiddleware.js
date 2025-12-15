const { hasPermission } = require("../models/adminPermissionModel");

<<<<<<< HEAD

=======
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
/**
 * @param {string} module 
 * @param {string} action 
 * @returns {Function} 
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.role_id === 1) {
        return next();
      }

      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

<<<<<<< HEAD
=======
      // Remove any existing 'can_' prefix and ensure proper format
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      const cleanAction = action.replace(/^can_?/, '').toLowerCase();
      const permitted = await hasPermission(adminId, module, cleanAction);
      
      if (!permitted) {
        return res.status(403).json({ 
          message: `Access denied. You don't have permission to ${cleanAction} ${module}.` 
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Server error during permission check" });
    }
  };
};

module.exports = { checkPermission }; 