const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/partylistUploadMiddleware');
const partylistController = require('../controllers/partylistController');
const { verifyToken, isSuperAdmin, isAdmin } = require('../middlewares/authMiddleware');

<<<<<<< HEAD

router.post('/',
  verifyToken, (req, res, next) => {
=======
router.post('/',
  verifyToken, (req, res, next) => {
    // Allow both Super Admin and Admin to create partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to access partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to access archived partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to access partylist details
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to update partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to archive partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to restore partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to permanently delete partylists
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to add partylist candidates
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
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
<<<<<<< HEAD
=======
    // Allow both Super Admin and Admin to remove partylist candidates
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (req.user.role_id === 1 || req.user.role_id === 2) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }
  },
  partylistController.removePartylistCandidate
);

module.exports = router; 