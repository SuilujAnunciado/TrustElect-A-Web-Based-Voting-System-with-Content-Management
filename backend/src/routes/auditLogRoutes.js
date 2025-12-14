const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkPermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/',
  checkPermission('auditLog', 'canView'),
  auditLogController.getAuditLogs
);

router.get(
  '/summary',
  checkPermission('auditLog', 'canView'),
  auditLogController.getAuditLogsSummary
);

router.post(
  '/',
  checkPermission('auditLog', 'canCreate'),
  auditLogController.createAuditLog
);

router.get(
  '/user/:userId',
  checkPermission('auditLog', 'canView'),
  auditLogController.getUserActivityHistory
);

router.get(
  '/entity/:entityType/:entityId',
  checkPermission('auditLog', 'canView'),
  auditLogController.getEntityActivityHistory
);

router.delete(
  '/old',
  checkPermission('auditLog', 'canDelete'),
  auditLogController.deleteOldAuditLogs
);

module.exports = router; 