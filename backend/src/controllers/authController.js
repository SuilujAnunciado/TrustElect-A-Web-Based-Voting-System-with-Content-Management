const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { getAdminByEmail } = require("../models/adminModel");
const { getStudentByEmail } = require("../models/studentModel");
const pool = require("../config/db");
const otpService = require('../services/otpService');
const smsService = require('../services/smsService');
const { logAction } = require('../middlewares/auditLogMiddleware');
require("dotenv").config();


const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 5;

exports.checkEmailExists = async (req, res) => {
  
  try {
    const { email } = req.body;

    if (!email || (!email.endsWith("@novaliches.sti.edu.ph") && !email.endsWith("@novaliches.sti.edu"))) {
      return res.status(400).json({ success: false, message: "Invalid STI email format." });
    }

    const query = "SELECT id FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Email is not registered." });
    }

    return res.status(200).json({ success: true, message: "Email is valid" });

  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    if (!email || (!email.endsWith("@novaliches.sti.edu.ph") && !email.endsWith("@novaliches.sti.edu"))) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    let user = null;
    let role = null;
    let studentId = null;

    const superAdminQuery = "SELECT * FROM users WHERE email = $1 AND role_id = 1";
    const superAdminResult = await pool.query(superAdminQuery, [email]);

    if (superAdminResult.rows.length > 0) {
      user = superAdminResult.rows[0];
      role = "Super Admin";
      // Set default department for Super Admin
      user.department = "Administrator";
      user.canApproveElections = true; // Super Admin always can approve
    }

    if (!user) {
      user = await getAdminByEmail(email);
      role = "Admin";
      
      // Get department information for admin users
      if (user) {
        const adminQuery = "SELECT department FROM admins WHERE user_id = $1";
        const adminResult = await pool.query(adminQuery, [user.id]);
        if (adminResult.rows.length > 0) {
          user.department = adminResult.rows[0].department;
          
          // Check if this admin should have approval rights
          // Only admins with "Administrator" department can approve elections
          user.canApproveElections = user.department === 'Administrator';
        } else {
          user.canApproveElections = false;
        }
      }
    }

   
    if (!user) {
      user = await getStudentByEmail(email);
      role = "Student";
      
      if (user) {
        const studentQuery = "SELECT id FROM students WHERE email = $1";
        const studentResult = await pool.query(studentQuery, [email]);
        if (studentResult.rows.length > 0) {
          studentId = studentResult.rows[0].id;
      
        }
      }
    }

    if (!user) {

      await logAction(
        { id: 0, email: email, role: 'Unknown' },
        'LOGIN_FAILED',
        'auth',
        null,
        { reason: 'Invalid credentials', ipAddress }
      );
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (user.is_locked && user.locked_until > new Date()) {
      await logAction(
        { id: user.id, email: user.email, role },
        'LOGIN_FAILED',
        'auth',
        null,
        { reason: 'Account locked', ipAddress }
      );
      return res.status(403).json({
        success: false,
        message: `Your account is locked. Try again later.`,
      });
    }

    if (!user.is_active) {

      await logAction(
        { id: user.id, email: user.email, role },
        'LOGIN_FAILED',
        'auth',
        null,
        { reason: 'Account inactive', ipAddress }
      );
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact your admin.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      await handleFailedLogin(user.id);
      // Log failed login with wrong password
      await logAction(
        { id: user.id, email: user.email, role },
        'LOGIN_FAILED',
        'auth',
        null,
        { reason: 'Invalid password', ipAddress }
      );
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    await resetFailedAttempts(user.id);

    // Include studentId in token if user is a student
    const tokenPayload = { 
      id: user.id, 
      email: user.email, 
      role 
    };
    
    // Include department and approval rights for admin and super admin users
    if ((role === "Admin" || role === "Super Admin") && user.department) {
      tokenPayload.department = user.department;
      tokenPayload.canApproveElections = user.canApproveElections || false;
    }

    if (role === "Student" && studentId) {
      tokenPayload.studentId = studentId;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    const response = {
      success: true,
      message: "Login successful",
      token,
      user_id: user.id,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        username: user.username,
        role,
        department: user.department || null,
      },
      role: role,
    };
    

    if (role === "Student" && studentId) {
      response.studentId = studentId;
    }

    // Log successful login
    await logAction(
      { id: user.id, email: user.email, role },
      'LOGIN',
      'auth',
      user.id,
      { ipAddress, userAgent: req.headers['user-agent'] || 'unknown' }
    );

    res.status(200).json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error. Please try again." });
  }
};

const handleFailedLogin = async (userId) => {
  try {
    const query = `
      UPDATE users
      SET login_attempts = login_attempts + 1,
          is_locked = CASE WHEN login_attempts + 1 >= $1 THEN TRUE ELSE FALSE END,
          locked_until = CASE WHEN login_attempts + 1 >= $1 THEN NOW() + (CAST($2 AS INTEGER) * INTERVAL '1 minute') ELSE NULL END
      WHERE id = $3 RETURNING login_attempts, is_locked, locked_until;
    `;
    const result = await pool.query(query, [MAX_FAILED_ATTEMPTS, LOCK_TIME_MINUTES, userId]);

    if (result.rows.length > 0) {
      if (result.rows[0].is_locked) {
      }
    }
  } catch (error) {
    console.error("Error handling failed login attempt:", error);
  }
};

const resetFailedAttempts = async (userId) => {
  try {
    const query = `
      UPDATE users
      SET login_attempts = 0, is_locked = FALSE, locked_until = NULL
      WHERE id = $1;
    `;
    await pool.query(query, [userId]);
  } catch (error) {
    console.error("Error resetting failed login attempts:", error);
  }
};

exports.studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Get student with both user and student info
    const student = await getStudentByEmail(email);
    if (!student) {
      // Log failed student login
      await logAction(
        { id: 0, email, role: 'Student' },
        'LOGIN_FAILED',
        'auth',
        null,
        { reason: 'Invalid credentials', ipAddress }
      );
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(password, student.password);
    if (!isValidPassword) {
      // Log failed student login with wrong password
      await logAction(
        { id: student.id, email: student.email, role: 'Student' },
        'LOGIN_FAILED',
        'auth',
        student.id,
        { reason: 'Invalid password', ipAddress }
      );
      return res.status(401).json({ message: "Invalid email or password" });
    }


    if (!student.student_id) {
      console.error("Student ID missing for student:", student.id);
      // Log configuration error
      await logAction(
        { id: student.id, email: student.email, role: 'Student' },
        'LOGIN_FAILED',
        'auth',
        student.id,
        { reason: 'Configuration error', ipAddress }
      );
      return res.status(500).json({ message: "Student account configuration error" });
    }

    const token = jwt.sign(
      { 
        id: student.id,
        studentId: student.student_id,
        role: "Student",
        email: student.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Log successful student login
    await logAction(
      { id: student.id, email: student.email, role: 'Student' },
      'LOGIN',
      'auth',
      student.id,
      { ipAddress, userAgent: req.headers['user-agent'] || 'unknown' }
    );

    res.json({
      token,
      user: {
        id: student.id,
        email: student.email,
        role: "Student",
        studentId: student.student_id
      },
      studentId: student.student_id
    });
  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
};

exports.requestOTP = async (req, res) => {
  try {
    const { userId, email } = req.body;
 
    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID and email are required'
      });
    }
    
    const result = await otpService.requestOTP(userId, email);

    if (process.env.NODE_ENV === 'development' && result.dev) {
      const maskedEmail = maskEmail(result.email);
      

      return res.status(200).json({
        success: true,
        message: `Verification code for ${maskedEmail}`,
        devMode: true,
        otp: result.otp
      });
    }
    
    if (result.isSystemAccount) {
      const maskedOriginal = maskEmail(result.email);
      const maskedRecipient = maskEmail(result.recipientEmail);
      
      return res.status(200).json({
        success: true,
        message: `Verification code for ${maskedOriginal} sent to administrator (${maskedRecipient})`,
        isSystemAccount: true
      });
    }

    const maskedEmail = maskEmail(email);
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskedEmail}`
    });
  } catch (error) {
    console.error('Error in requestOTP:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send verification code'
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required'
      });
    }

    const isValid = await otpService.verifyOTP(userId, otp);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      verified: true
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Verification failed'
    });
  }
};

exports.checkFirstLogin = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    
    const query = "SELECT is_first_login FROM users WHERE id = $1";
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      isFirstLogin: result.rows[0].is_first_login
    });
  } catch (error) {
    console.error('Error checking first login status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to check first login status'
    });
  }
};

exports.changeFirstLoginPassword = async (req, res) => {
  try {
    const userId = req.userId; 
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const checkQuery = "SELECT is_first_login, role_id FROM users WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = checkResult.rows[0];
 
    if (!user.is_first_login) {
      return res.status(400).json({
        success: false,
        message: 'This is not your first login'
      });
    }
  
    if (user.role_id !== 2 && user.role_id !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Operation not allowed for this user type'
      });
    }
 
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    const updateQuery = `
      UPDATE users
      SET password_hash = $1, is_first_login = FALSE, updated_at = NOW()
      WHERE id = $2
    `;
    
    await pool.query(updateQuery, [hashedPassword, userId]);
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing first-time password:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
};

function maskEmail(email) {
  if (!email) return '***@***.com';
  
  const [localPart, domain] = email.split('@');
  const maskedLocal = localPart.charAt(0) + 
                    '*'.repeat(Math.max(localPart.length - 2, 1)) + 
                    localPart.charAt(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || (!email.endsWith("@novaliches.sti.edu.ph") && !email.endsWith("@novaliches.sti.edu"))) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid STI email address." 
      });
    }
    const userQuery = "SELECT id, role_id FROM users WHERE email = $1 AND is_active = TRUE";
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "If your email is registered, you will receive a reset code."
      });
    }
    
    const userId = userResult.rows[0].id;
 
    const result = await otpService.requestOTP(userId, email);

    await pool.query(
      "UPDATE otps SET purpose = 'reset' WHERE user_id = $1 AND verified = FALSE",
      [userId]
    );

    if (process.env.NODE_ENV === 'development' && result.dev) {
      const maskedEmail = maskEmail(email);
      return res.status(200).json({
        success: true,
        message: `Password reset code for ${maskedEmail}`,
        devMode: true,
        otp: result.otp
      });
    }
    
    const maskedEmail = maskEmail(email);
    return res.status(200).json({
      success: true,
      message: `Password reset code sent to ${maskedEmail}`
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request. Please try again later.'
    });
  }
};

exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    const userQuery = "SELECT id FROM users WHERE email = $1";
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
    
    const userId = userResult.rows[0].id;

    const otpQuery = `
      SELECT id FROM otps 
      WHERE user_id = $1 
      AND otp = $2 
      AND expires_at > NOW() 
      AND verified = FALSE 
      AND attempts <= 5
      AND (purpose = 'reset' OR purpose IS NULL)
    `;
    
    const otpResult = await pool.query(otpQuery, [userId, otp]);
    
    if (otpResult.rows.length === 0) {
      await pool.query(
        'UPDATE otps SET attempts = attempts + 1 WHERE user_id = $1 AND verified = FALSE',
        [userId]
      );
      
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    await pool.query(
      'UPDATE otps SET verified = TRUE WHERE id = $1',
      [otpResult.rows[0].id]
    );

    const resetToken = jwt.sign(
      { userId, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      resetToken
    });
  } catch (error) {
    console.error('Error in verifyResetOTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      
      if (decoded.purpose !== 'reset') {
        throw new Error('Invalid token purpose');
      }
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateQuery = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW(), is_first_login = FALSE
      WHERE id = $2
      RETURNING id, email
    `;
    
    const updateResult = await pool.query(updateQuery, [hashedPassword, decoded.userId]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.'
    });
  }
};

// Phone registration and SMS OTP functions using your existing schema
exports.registerPhone = async (req, res) => {
  try {
    console.log('Phone registration request:', req.body);
    
    const { userId, email, phoneNumber } = req.body;
    
    if (!userId || !email || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'User ID, email, and phone number are required'
      });
    }
    
    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    console.log('Formatted phone:', formattedPhone);
    
    try {
      // Check if user already has a phone number
      const existingPhoneResult = await pool.query(
        'SELECT phone_number FROM users WHERE id = $1',
        [userId]
      );
      
      const existingPhone = existingPhoneResult.rows[0]?.phone_number;
      
      if (existingPhone) {
        return res.status(200).json({
          success: true,
          message: `Phone number ${existingPhone} is already registered. Click "Send OTP" to receive verification code.`,
          phoneNumber: existingPhone,
          alreadyRegistered: true
        });
      }
      
      await pool.query(
        'UPDATE users SET phone_number = $1 WHERE id = $2',
        [formattedPhone, userId]
      );
      console.log('Phone number updated for user:', userId);
      
    } catch (dbError) {
      console.error('Database error storing phone number:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to register phone number. Please try again.',
        error: dbError.message
      });
    }
    
    // Return success without sending OTP
    return res.status(200).json({
      success: true,
      message: `Phone number ${formattedPhone} registered successfully. Click "Send OTP" to receive verification code.`,
      phoneNumber: formattedPhone,
      alreadyRegistered: false
    });
    
  } catch (error) {
    console.error('Phone registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register phone number. Please try again.'
    });
  }
};

exports.verifySmsOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'User ID and OTP are required'
      });
    }
    
    // Validate OTP format
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be exactly 6 digits'
      });
    }
    
    // Get user's phone number
    const phoneResult = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    const phoneNumber = phoneResult.rows[0]?.phone_number;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number found for this user'
      });
    }
    
    // Security check: Ensure OTP was recently sent to this user
    const recentOtpQuery = `
      SELECT id, created_at FROM otps 
      WHERE user_id = $1 
      AND created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const recentOtpResult = await pool.query(recentOtpQuery, [userId]);
    
    if (recentOtpResult.rows.length === 0) {
      console.log('No recent OTP found for user:', userId);
      return res.status(400).json({
        success: false,
        message: 'No recent OTP found. Please request a new verification code.'
      });
    }
    
    // For development mode, still verify OTP but allow specific test OTPs
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode OTP verification:', otp);
      
      // Only allow specific test OTPs in development mode for security
      const allowedTestOTPs = ['123456', '000000', '111111'];
      
      if (allowedTestOTPs.includes(otp)) {
        console.log('Test OTP accepted in development mode');
        
        // Mark phone as verified in users table
        await pool.query(
          'UPDATE users SET is_phone_verified = TRUE WHERE id = $1',
          [userId]
        );
        
        return res.status(200).json({
          success: true,
          message: 'Phone number verified successfully (development mode)',
          phoneNumber: phoneNumber,
          testMode: true
        });
      } else {
        // In development, still try to verify with iProgSMS for other OTPs
        console.log('Non-test OTP in development mode, verifying with iProgSMS...');
      }
    }
    
    // Use iProgSMS verify_otp endpoint for production and non-test OTPs in development
    console.log('Verifying OTP with iProgSMS for phone:', phoneNumber);
    const verifyResult = await smsService.verifyOTP(phoneNumber, otp, userId);
    
    if (!verifyResult.success) {
      console.error('iProgSMS verification failed:', verifyResult);
      
      // SECURITY: No database fallback - OTP must be verified through iProgSMS
      // This prevents security bypass where invalid OTPs could be accepted
      console.log('OTP verification failed - no fallback for security reasons');
      
      // Increment attempts for failed verification
      await pool.query(
        'UPDATE otps SET attempts = attempts + 1 WHERE user_id = $1 AND verified = false',
        [userId]
      );
      
      // Handle specific error codes with appropriate HTTP status codes
      let statusCode = 400;
      if (verifyResult.code === 'OTP_EXPIRED') {
        statusCode = 401; // Unauthorized for expired OTP
      } else if (verifyResult.code === 'AUTH_FAILED') {
        statusCode = 500; // Server error for API authentication issues
      } else if (verifyResult.code === 'INVALID_OTP') {
        statusCode = 400; // Bad request for invalid OTP
      }
      
      return res.status(statusCode).json({
        success: false,
        message: verifyResult.error || 'Invalid or expired verification code',
        code: verifyResult.code
      });
    }
    
    // Mark phone as verified in users table
    await pool.query(
      'UPDATE users SET is_phone_verified = TRUE WHERE id = $1',
      [userId]
    );
    
    // Log successful verification
    await logAction(
      { id: userId, email: 'SMS_VERIFIED', role: 'SMS_VERIFICATION' },
      'SMS_VERIFIED',
      'auth',
      userId,
      { phoneNumber: phoneNumber, provider: 'iProgSMS' }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      phoneNumber: phoneNumber,
      provider: 'iProgSMS'
    });
    
  } catch (error) {
    console.error('SMS OTP verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify SMS code. Please try again.'
    });
  }
};

// Resend SMS OTP function
// Send SMS OTP after phone registration
// Check if user has registered phone number
exports.checkPhoneRegistration = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if user has a phone number
    const phoneResult = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    const phoneNumber = phoneResult.rows[0]?.phone_number;
    
    if (phoneNumber) {
      return res.status(200).json({
        success: true,
        hasPhone: true,
        phoneNumber: phoneNumber,
        message: `Phone number ${phoneNumber} is registered. You can use SMS OTP.`
      });
    } else {
      return res.status(200).json({
        success: true,
        hasPhone: false,
        message: 'No phone number registered. Please register your phone number first.'
      });
    }
    
  } catch (error) {
    console.error('Check phone registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check phone registration. Please try again.'
    });
  }
};

exports.sendSmsOtp = async (req, res) => {
  try {    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check iProgSMS configuration
    console.log('iProgSMS config check:');
    console.log('IPROGSMS_API_KEY:', process.env.IPROGSMS_API_KEY ? 'Set' : 'Missing');
    console.log('IPROGSMS_SENDER_NAME:', process.env.IPROGSMS_SENDER_NAME ? process.env.IPROGSMS_SENDER_NAME : 'TrustElect');
    
    const phoneResult = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    const phoneNumber = phoneResult.rows[0]?.phone_number;
    
    console.log('User phone number:', phoneNumber);
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number found for this user. Please register your phone number first.'
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated SMS OTP:', otp);
    
    try {
      // Store OTP in database
      const insertQuery = `
        INSERT INTO otps (user_id, otp, expires_at, verified, attempts, purpose)
        VALUES ($1, $2, NOW() + INTERVAL '5 minutes', $3, $4, $5)
      `;
      
      await pool.query(insertQuery, [
        userId, 
        otp, 
        false, 
        0, 
        'verification'
      ]);
      console.log('OTP stored in database successfully');
    } catch (dbError) {
      console.error('Database error storing OTP:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate verification code. Please try again.',
        error: dbError.message
      });
    }
    
    // Send SMS
    console.log('Attempting to send SMS to:', phoneNumber);
    const smsResult = await smsService.sendOTPSMS(phoneNumber, otp);
    console.log('SMS result:', smsResult);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult);
      
      // If it's a configuration issue, return the OTP for testing
      if (smsResult.code === 'CONFIG_ERROR' || smsResult.code === 401 || smsResult.code === 402) {
        console.log('iProgSMS configuration issue detected, returning OTP for testing');
        return res.status(200).json({
          success: true,
          message: `SMS verification code sent to ${phoneNumber}`,
          devMode: true,
          otp: otp
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send SMS. Please try again.',
        error: smsResult.error,
        code: smsResult.code
      });
    }
    
    // In development mode, return OTP for testing
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: `SMS verification code sent to ${phoneNumber}`,
        devMode: true,
        otp: otp
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `SMS verification code sent to ${phoneNumber}`
    });
    
  } catch (error) {
    console.error('Send SMS OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send SMS code. Please try again.',
      error: error.message
    });
  }
};

// Test SMS with iProgSMS
exports.testSms = async (req, res) => {
  try {
    console.log('Testing SMS with iProgSMS...');
    
    // Check iProgSMS configuration
    const config = {
      apiKey: process.env.IPROGSMS_API_KEY ? 'Set' : 'Missing',
      senderName: process.env.IPROGSMS_SENDER_NAME || 'TrustElect',
      apiUrl: process.env.IPROGSMS_API_URL || 'https://sms.iprogtech.com/api/v1'
    };
    
    console.log('iProgSMS config:', config);
    
    if (!process.env.IPROGSMS_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'iProgSMS configuration incomplete. Please set IPROGSMS_API_KEY in your .env file',
        config: config
      });
    }
    
    // Test sending SMS
    const testPhone = '09120083491'; // Your test number (09 format for iProgSMS)
    const testMessage = 'Test from TrustElect - iProgSMS is working! 🎉';
    
    console.log('iProgSMS advantages:');
    console.log('- Reliable SMS delivery');
    console.log('- Philippines network coverage');
    console.log('- Competitive pricing');
    console.log('- Easy integration');
    
    console.log('Sending SMS from:', process.env.IPROGSMS_SENDER_NAME || 'TrustElect');
    console.log('Sending SMS to:', testPhone);
    console.log('Phone number length:', testPhone.length);
    console.log('Phone number format check:', /^09[0-9]{9}$/.test(testPhone));
    
    const smsResult = await smsService.sendSMS(testPhone, testMessage);
    
    // Handle iProgSMS errors
    if (!smsResult.success) {
      return res.status(400).json({
        success: false,
        message: 'SMS sending failed',
        config: config,
        error: smsResult.error,
        code: smsResult.code,
        provider: 'iProgSMS',
        troubleshooting: {
          step1: 'Check your iProgSMS API key',
          step2: 'Verify you have sufficient credits',
          step3: 'Check phone number format (09123456789)',
          step4: 'Review iProgSMS account status'
        },
        response: smsResult.response
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'SMS test completed',
      config: config,
      smsResult: smsResult
    });
    
  } catch (error) {
    console.error('SMS test error:', error);
    return res.status(500).json({
      success: false,
      message: 'SMS test failed',
      error: error.message
    });
  }
};


exports.resendSmsOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const phoneResult = await pool.query('SELECT phone_number FROM users WHERE id = $1', [userId]);
    const phoneNumber = phoneResult.rows[0]?.phone_number;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'No phone number found for this user'
      });
    }

    const recentOtpQuery = `
      SELECT created_at, attempts FROM otps 
      WHERE user_id = $1 
      AND phone_number = $2 
      AND otp_type = 'sms'
      AND created_at > NOW() - INTERVAL '2 minutes'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const recentOtpResult = await pool.query(recentOtpQuery, [userId, phoneNumber]);
    
    if (recentOtpResult.rows.length > 0) {
      const recentOtp = recentOtpResult.rows[0];
      const timeSinceLastOtp = Math.floor((Date.now() - new Date(recentOtp.created_at).getTime()) / 1000);
      const remainingCooldown = 120 - timeSinceLastOtp; 
      
      if (remainingCooldown > 0) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingCooldown} seconds before requesting another code`,
          cooldownRemaining: remainingCooldown
        });
      }
    }

    const attemptsQuery = `
      SELECT COUNT(*) as attempt_count FROM otps 
      WHERE user_id = $1 
      AND phone_number = $2 
      AND otp_type = 'sms'
      AND created_at > NOW() - INTERVAL '1 hour'
    `;
    
    const attemptsResult = await pool.query(attemptsQuery, [userId, phoneNumber]);
    const attemptCount = parseInt(attemptsResult.rows[0].attempt_count);
    
    if (attemptCount >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again in an hour.',
        retryAfter: 3600
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Resending SMS OTP:', otp);
 
    const insertQuery = `
      INSERT INTO otps (user_id, phone_number, otp, expires_at, otp_type, verified, attempts, purpose)
      VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes', 'sms', FALSE, 0, 'verification')
    `;
    
    await pool.query(insertQuery, [userId, phoneNumber, otp]);

    const smsResult = await smsService.sendOTPSMS(phoneNumber, otp);

    
    if (!smsResult.success) {
      console.error('Resend SMS sending failed:', smsResult);
      
      if (smsResult.code === 'CONFIG_ERROR' || smsResult.code === 401 || smsResult.code === 402) {
        console.log('iProgSMS configuration issue detected, returning OTP for testing');
        return res.status(200).json({
          success: true,
          message: `SMS verification code resent to ${phoneNumber}`,
          devMode: true,
          otp: otp
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to resend SMS. Please try again.',
        error: smsResult.error,
        code: smsResult.code
      });
    }

    await logAction(
      { id: userId, email: 'SMS_RESEND', role: 'SMS_RESEND' },
      'SMS_RESEND',
      'auth',
      userId,
      { phoneNumber: phoneNumber, provider: 'iProgSMS' }
    );

    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: `SMS verification code resent to ${phoneNumber}`,
        devMode: true,
        otp: otp
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `SMS verification code resent to ${phoneNumber}`
    });
    
  } catch (error) {
    console.error('Resend SMS OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend SMS code. Please try again.'
    });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    let userData = null;
    
    if (req.user) {
      userData = { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role || 'Unknown' 
      };
    } 
    else if (req.body.userId || req.body.email) {
      userData = {
        id: req.body.userId || 0,
        email: req.body.email || 'unknown@example.com',
        role: req.body.role || 'Unknown'
      };
    }

    if (userData) {
      await logAction(
        userData,
        'LOGOUT',
        'auth',
        userData.id !== 0 ? userData.id : null,
        { 
          ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        }
      );
    }

    res.status(200).json({ 
      success: true, 
      message: "Logout successful" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Error processing logout" });
  }
};