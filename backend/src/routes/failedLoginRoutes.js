const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');
const { getFailedLoginReport } = require('../controllers/failedLoginController');


router.get('/failed-logins', verifyToken, isSuperAdmin, getFailedLoginReport);

module.exports = router; 