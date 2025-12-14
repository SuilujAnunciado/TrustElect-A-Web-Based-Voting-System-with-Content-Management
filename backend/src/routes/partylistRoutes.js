const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/partylistUploadMiddleware');
const partylistController = require('../controllers/partylistController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');


router.post('/',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  upload.single('logo'),
  partylistController.createPartylist
);

router.get('/',
  verifyToken, (req, res, next) => {
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
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.getPartylistById
);

router.put('/:id',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  upload.single('logo'),
  partylistController.updatePartylist
);

router.delete('/:id',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.archivePartylist
);

router.post('/:id/restore',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.restorePartylist
);

router.delete('/:id/permanent',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.permanentDeletePartylist
);

router.post('/:partylistId/candidates',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.addPartylistCandidate
);

router.delete('/:partylistId/candidates/:studentId',
  verifyToken, (req, res, next) => {
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.removePartylistCandidate
);

module.exports = router; 