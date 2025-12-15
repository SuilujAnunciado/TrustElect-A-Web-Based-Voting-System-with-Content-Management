const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

<<<<<<< HEAD

router.use(verifyToken);

=======
// Protect all routes
router.use(verifyToken);

// Get audit logs
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/',
  checkPermission('auditLog', 'canView'),
  auditLogController.getAuditLogs
);

<<<<<<< HEAD
=======
// Get audit logs summary
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/summary',
  checkPermission('auditLog', 'canView'),
  auditLogController.getAuditLogsSummary
);

<<<<<<< HEAD
=======
// Create audit logs
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.post(
  '/',
  checkPermission('auditLog', 'canCreate'),
  auditLogController.createAuditLog
);

<<<<<<< HEAD
=======
// Get user activity history
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/user/:userId',
  checkPermission('auditLog', 'canView'),
  auditLogController.getUserActivityHistory
);

<<<<<<< HEAD
=======
// Get entity activity history
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get(
  '/entity/:entityType/:entityId',
  checkPermission('auditLog', 'canView'),
  auditLogController.getEntityActivityHistory
);

<<<<<<< HEAD
=======
// Delete old audit logs (admin only)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.delete(
  '/old',
  checkPermission('auditLog', 'canDelete'),
  auditLogController.deleteOldAuditLogs
);

module.exports = router; 