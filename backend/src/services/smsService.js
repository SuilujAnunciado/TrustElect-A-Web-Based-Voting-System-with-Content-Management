const axios = require('axios');

// EasySendSMS Configuration (15 free SMS trial available)
const EASYSENDSMS_API_KEY = process.env.EASYSENDSMS_API_KEY;
const EASYSENDSMS_SENDER_NAME = process.env.EASYSENDSMS_SENDER_NAME || 'TrustElect';

/**
 * Format phone number to international format for EasySendSMS
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
 * Send SMS using EasySendSMS (15 free SMS trial available)
 * @param {string} phoneNumber - Phone number to send SMS to
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - EasySendSMS message result
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if EasySendSMS is properly configured
    if (!EASYSENDSMS_API_KEY) {
      console.error('EasySendSMS configuration missing:', {
        apiKey: !!EASYSENDSMS_API_KEY
      });
      return { 
        success: false, 
        error: 'EasySendSMS configuration is incomplete. Please check your EASYSENDSMS_API_KEY environment variable.',
        code: 'CONFIG_ERROR'
      };
    }
    
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Sending SMS to:', formattedNumber);
    console.log('Using EasySendSMS service');
    
    // Prepare EasySendSMS API request
    const smsData = {
      from: EASYSENDSMS_SENDER_NAME,
      to: formattedNumber.replace('+', ''), // Remove + for EasySendSMS
      text: message,
      type: "0" // 0 for plain text, 1 for Unicode
    };
    
    // Make API request to EasySendSMS
    const response = await axios.post(
      'https://restapi.easysendsms.app/v1/rest/sms/send',
      smsData,
      {
        headers: {
          'apikey': EASYSENDSMS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('SMS sent successfully via EasySendSMS:', response.data);
    
    // Extract message ID from response
    const messageId = response.data?.messageIds?.[0] || 'unknown';
    
    return { 
      success: true, 
      messageId: messageId,
      to: formattedNumber,
      status: 'sent',
      provider: 'EasySendSMS',
      cost: 'Using free trial credits'
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Handle specific EasySendSMS errors
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'EasySendSMS authentication failed. Please check your API key.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request. Please check phone number format and message content.';
    } else if (error.response?.data?.error === 4012) {
      errorMessage = 'Invalid mobile number format.';
    } else if (error.response?.data?.error === 4013) {
      errorMessage = 'Insufficient credits. Please top up your account.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.response?.data?.error || error.response?.status || 'UNKNOWN_ERROR',
      originalError: error.message,
      provider: 'EasySendSMS'
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
