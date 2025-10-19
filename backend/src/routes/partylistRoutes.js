const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/partylistUploadMiddleware');
const partylistController = require('../controllers/partylistController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');

router.post('/',
  verifyToken, isSuperAdmin,
  upload.single('logo'),
  partylistController.createPartylist
);

router.get('/',
  verifyToken, (req, res, next) => {
    // Allow both Super Admin and Admin to access partylists
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.getAllPartylists
);

router.get('/archived',
  verifyToken, (req, res, next) => {
    // Allow both Super Admin and Admin to access archived partylists
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.getArchivedPartylists
);

router.get('/:id',
  verifyToken, (req, res, next) => {
    // Allow both Super Admin and Admin to access partylist details
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.getPartylistById
);

router.put('/:id',
  verifyToken, isSuperAdmin,
  upload.single('logo'),
  partylistController.updatePartylist
);

router.delete('/:id',
  verifyToken, isSuperAdmin,
  partylistController.archivePartylist
);

router.post('/:id/restore',
  verifyToken, isSuperAdmin,
  partylistController.restorePartylist
);

router.delete('/:id/permanent',
  verifyToken, isSuperAdmin,
  partylistController.permanentDeletePartylist
);

router.post('/:partylistId/candidates',
  verifyToken, isSuperAdmin,
  partylistController.addPartylistCandidate
);

router.delete('/:partylistId/candidates/:studentId',
  verifyToken, isSuperAdmin,
  partylistController.removePartylistCandidate
);

module.exports = router; 