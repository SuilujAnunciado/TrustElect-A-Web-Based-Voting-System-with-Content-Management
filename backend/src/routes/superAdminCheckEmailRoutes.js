const express = require('express');
const router = express.Router();
const pool = require('../config/db');

<<<<<<< HEAD

=======
// Check if email already exists (for superadmin)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

<<<<<<< HEAD
    const userQuery = 'SELECT id FROM users WHERE email = $1 AND is_active = true';
    const userResult = await pool.query(userQuery, [email]);

=======
    // Check in users table (students)
    const userQuery = 'SELECT id FROM users WHERE email = $1 AND is_active = true';
    const userResult = await pool.query(userQuery, [email]);

    // Check in admins table
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    const adminQuery = 'SELECT id FROM admins WHERE email = $1 AND is_active = true';
    const adminResult = await pool.query(adminQuery, [email]);

    const exists = userResult.rows.length > 0 || adminResult.rows.length > 0;

    res.json({
      success: true,
      exists: exists,
      message: exists ? 'Email already exists' : 'Email is available'
    });

  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking email availability'
    });
  }
});

module.exports = router;
