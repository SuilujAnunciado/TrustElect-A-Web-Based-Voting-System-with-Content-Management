const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');
const { getPermissions, updatePermissions, checkPermissions } = require('../controllers/adminPermissionController');

<<<<<<< HEAD

router.get('/:adminId', verifyToken, (req, res, next) => {
  const user = req.user;
  
=======
// Allow both Super Admin and Admin to access admin permissions
router.get('/:adminId', verifyToken, (req, res, next) => {
  const user = req.user;
  
  // Super Admin always has access
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  if (user.normalizedRole === 'Super Admin') {
    return next();
  }
  
<<<<<<< HEAD
  if (user.normalizedRole === 'Admin') {
    return next();
  }

=======
  // Admin users also have access
  if (user.normalizedRole === 'Admin') {
    return next();
  }
  
  // For other roles, deny access
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  return res.status(403).json({ 
    message: "Access denied. Only Super Admin and Admin can manage admin permissions." 
  });
}, getPermissions);

router.put('/:adminId', verifyToken, (req, res, next) => {
  const user = req.user;
<<<<<<< HEAD

  if (user.normalizedRole === 'Super Admin') {
    return next();
  }

  if (user.normalizedRole === 'Admin') {
    return next();
  }

=======
  
  // Super Admin always has access
  if (user.normalizedRole === 'Super Admin') {
    return next();
  }
  
  // Admin users also have access
  if (user.normalizedRole === 'Admin') {
    return next();
  }
  
  // For other roles, deny access
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  return res.status(403).json({ 
    message: "Access denied. Only Super Admin and Admin can manage admin permissions." 
  });
}, updatePermissions);

router.get('/:adminId/check', verifyToken, checkPermissions);

module.exports = router; 