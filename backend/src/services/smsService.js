const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Format phone number to international format for Twilio
 * @param {string} phoneNumber - Phone number in various formats
 * @returns {string} - Formatted phone number with +63 prefix
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any spaces, dashes, parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If starts with 09, replace with +63
  if (cleaned.startsWith('09')) {
    cleaned = '+63' + cleaned.substring(1);
  }
  
  // If starts with 63, add +
  if (cleaned.startsWith('63') && !cleaned.startsWith('+63')) {
    cleaned = '+' + cleaned;
  }
  
  // If starts with +63, keep as is
  if (cleaned.startsWith('+63')) {
    return cleaned;
  }
  
  // Default: add +63
  return '+63' + cleaned;
};

/**
 * Send SMS using Twilio
 * @param {string} phoneNumber - Phone number to send SMS to
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - Twilio message result
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if Twilio is properly configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.error('Twilio configuration missing:', {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: !!process.env.TWILIO_PHONE_NUMBER
      });
      return { 
        success: false, 
        error: 'Twilio configuration is incomplete. Please check your environment variables.',
        code: 'CONFIG_ERROR'
      };
    }
    
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Sending SMS to:', formattedNumber);
    console.log('From Twilio number:', process.env.TWILIO_PHONE_NUMBER);
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    console.log('SMS sent successfully:', result.sid);
    return { 
      success: true, 
      messageId: result.sid,
      to: formattedNumber,
      status: result.status
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      moreInfo: error.moreInfo
    });
    
    // Handle specific Twilio errors
    let errorMessage = error.message;
    if (error.code === 21211) {
      errorMessage = 'Invalid phone number format. Please check the number and try again.';
    } else if (error.code === 21214) {
      errorMessage = 'Phone number is not a valid mobile number.';
    } else if (error.code === 21610) {
      errorMessage = 'Phone number is not verified for your Twilio trial account. Please verify the number in your Twilio console.';
    } else if (error.code === 21614) {
      errorMessage = 'Phone number is not a valid mobile number.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code,
      originalError: error.message
    };
  }
};

/**
 * Send OTP SMS for phone verification
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - SMS sending result
 */
const sendOTPSMS = async (phoneNumber, otp) => {
  const message = `Your TrustElect verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
  return await sendSMS(phoneNumber, message);
};

/**
 * Send election notification SMS
 * @param {string} phoneNumber - Phone number to send notification to
 * @param {string} electionTitle - Title of the election
 * @param {string} message - Custom message
 * @returns {Promise<Object>} - SMS sending result
 */
const sendElectionNotificationSMS = async (phoneNumber, electionTitle, message) => {
  const smsMessage = `TrustElect: ${electionTitle}\n\n${message}\n\nVisit your student portal to participate.`;
  return await sendSMS(phoneNumber, smsMessage);
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendElectionNotificationSMS,
  formatPhoneNumber
};
