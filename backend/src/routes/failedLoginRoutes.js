const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../middlewares/authMiddleware');
const { getFailedLoginReport } = require('../controllers/failedLoginController');

<<<<<<< HEAD

=======
// Get failed login report
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/failed-logins', verifyToken, isSuperAdmin, getFailedLoginReport);

module.exports = router; 