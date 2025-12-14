const express = require("express");
const { check } = require("express-validator");
const { 
  loginUser, 
  checkEmailExists, 
  requestOTP, 
  verifyOTP,
  checkFirstLogin,
  changeFirstLoginPassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  logoutUser,
  registerPhone,
  checkPhoneRegistration,
  sendSmsOtp,
  verifySmsOtp,
  resendSmsOtp,
  testSms,
  debugOtpSms,
  testIprogSmsDirect
} = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");
const router = express.Router();


router.post(
  "/login",
  [
    check("email", "Valid email is required").isEmail(),
    check("password", "Password is required").not().isEmpty(),
  ],
  loginUser
);

router.post("/check-email", checkEmailExists);

router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);

router.post('/logout', logoutUser);

router.get('/check-first-login', verifyToken, checkFirstLogin);
router.post('/change-first-password', verifyToken, [
  check("newPassword", "Password must be at least 8 characters").isLength({ min: 8 }),
], changeFirstLoginPassword);

router.post('/forgot-password', [
  check("email", "Valid email is required").isEmail(),
], forgotPassword);

router.post('/verify-reset-otp', [
  check("email", "Valid email is required").isEmail(),
  check("otp", "Verification code is required").isLength({ min: 6, max: 6 }),
], verifyResetOTP);

router.post('/reset-password', [
  check("resetToken", "Reset token is required").not().isEmpty(),
  check("newPassword", "Password must be at least 8 characters").isLength({ min: 8 }),
], resetPassword);

router.post('/register-phone', registerPhone);
router.post('/check-phone-registration', checkPhoneRegistration);
router.post('/send-sms-otp', sendSmsOtp);
router.post('/verify-sms-otp', verifySmsOtp);
router.post('/resend-sms-otp', resendSmsOtp);
router.get('/test-sms', testSms);
router.post('/debug-otp-sms', debugOtpSms);
router.post('/test-iprogsms-direct', testIprogSmsDirect);

module.exports = router;
