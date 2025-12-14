const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');
const { getPermissions, updatePermissions, checkPermissions } = require('../controllers/adminPermissionController');

router.get('/:adminId', verifyToken, (req, res, next) => {
  const user = req.user;
  
  if (user.normalizedRole === 'Super Admin') {
    return next();
  }
  
  if (user.normalizedRole === 'Admin') {
    return next();
  }

  return res.status(403).json({ 
    message: "Access denied. Only Super Admin and Admin can manage admin permissions." 
  });
}, getPermissions);

router.put('/:adminId', verifyToken, (req, res, next) => {
  const user = req.user;

  if (user.normalizedRole === 'Super Admin') {
    return next();
  }

  if (user.normalizedRole === 'Admin') {
    return next();
  }

  return res.status(403).json({ 
    message: "Access denied. Only Super Admin and Admin can manage admin permissions." 
  });
}, updatePermissions);

router.get('/:adminId/check', verifyToken, checkPermissions);

module.exports = router; 