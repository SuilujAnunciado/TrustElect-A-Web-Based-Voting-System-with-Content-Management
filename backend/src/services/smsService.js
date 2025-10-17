const axios = require('axios');

// iProgSMS Configuration
const IPROGSMS_API_KEY = process.env.IPROGSMS_API_KEY;
const IPROGSMS_SENDER_NAME = process.env.IPROGSMS_SENDER_NAME || 'TrustElect';
const IPROGSMS_API_URL = process.env.IPROGSMS_API_URL || 'https://sms.iprogtech.com/api/v1';

/**
 * Format phone number for iProgSMS (uses 09 format)
 * @param {string} phoneNumber - Phone number in various formats
 * @returns {string} - Formatted phone number in 09 format
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any spaces, dashes, parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If starts with +63, convert to 09
  if (cleaned.startsWith('+63')) {
    cleaned = '0' + cleaned.substring(3);
  }
  
  // If starts with 63, convert to 09
  if (cleaned.startsWith('63') && !cleaned.startsWith('09')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // If already starts with 09, keep as is
  if (cleaned.startsWith('09')) {
    return cleaned;
  }
  
  // Default: add 0
  return '0' + cleaned;
};

/**
 * Send SMS using iProgSMS
 * @param {string} phoneNumber - Phone number to send SMS to
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - iProgSMS message result
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if iProgSMS is properly configured
    if (!IPROGSMS_API_KEY) {
      console.error('iProgSMS configuration missing:', {
        apiKey: !!IPROGSMS_API_KEY
      });
      return { 
        success: false, 
        error: 'iProgSMS configuration is incomplete. Please check your IPROGSMS_API_KEY environment variable.',
        code: 'CONFIG_ERROR'
      };
    }
    
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Sending SMS to:', formattedNumber);
    console.log('Using iProgSMS service');
    
    // Prepare iProgSMS API request
    const smsData = {
      api_token: IPROGSMS_API_KEY,
      phone_number: formattedNumber,
      message: message
    };
    
    // Make API request to iProgSMS
    const response = await axios.post(
      `${IPROGSMS_API_URL}/otp/send_otp`,
      smsData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('SMS sent successfully via iProgSMS:', response.data);
    
    // Extract message ID from response
    // Note: Update based on actual iProgSMS response structure
    const messageId = response.data?.message_id || response.data?.id || 'unknown';
    
    return { 
      success: true, 
      messageId: messageId,
      to: formattedNumber,
      status: 'sent',
      provider: 'iProgSMS',
      cost: 'Using iProgSMS credits'
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Handle specific iProgSMS errors
    // Note: Update error handling based on actual iProgSMS error codes
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'iProgSMS authentication failed. Please check your API key.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request. Please check phone number format and message content.';
    } else if (error.response?.status === 402) {
      errorMessage = 'Insufficient credits. Please top up your account.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Please check your API permissions.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.response?.data?.error_code || error.response?.status || 'UNKNOWN_ERROR',
      originalError: error.message,
      provider: 'iProgSMS'
    };
  }
};

/**
 * Send OTP SMS for phone verification using iProgSMS OTP endpoint
 * @param {string} phoneNumber - Phone number to send OTP to
 * @param {string} otp - 6-digit OTP code (not used, iProgSMS generates its own)
 * @returns {Promise<Object>} - SMS sending result
 */
const sendOTPSMS = async (phoneNumber, otp) => {
  try {
    // Check if iProgSMS is properly configured
    if (!IPROGSMS_API_KEY) {
      console.error('iProgSMS configuration missing:', {
        apiKey: !!IPROGSMS_API_KEY
      });
      return { 
        success: false, 
        error: 'iProgSMS configuration is incomplete. Please check your IPROGSMS_API_KEY environment variable.',
        code: 'CONFIG_ERROR'
      };
    }
    
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log('Sending OTP SMS to:', formattedNumber);
    console.log('Using iProgSMS OTP service');
    
    // Prepare iProgSMS OTP API request
    const otpData = {
      api_token: IPROGSMS_API_KEY,
      phone_number: formattedNumber,
      message: "" // Empty message uses default: "Your OTP code is :otp. It is valid for 5 minutes. Do not share this code with anyone."
    };
    
    // Make API request to iProgSMS OTP endpoint
    const response = await axios.post(
      `${IPROGSMS_API_URL}/otp/send_otp`,
      otpData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('OTP SMS sent successfully via iProgSMS:', response.data);
    
    // Extract message ID from response
    const messageId = response.data?.message_id || response.data?.id || 'unknown';
    
    return { 
      success: true, 
      messageId: messageId,
      to: formattedNumber,
      status: 'sent',
      provider: 'iProgSMS',
      cost: 'Using iProgSMS credits',
      note: 'iProgSMS generated OTP automatically'
    };
  } catch (error) {
    console.error('OTP SMS sending error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Handle specific iProgSMS errors
    let errorMessage = error.message;
    if (error.response?.status === 401) {
      errorMessage = 'iProgSMS authentication failed. Please check your API key.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request. Please check phone number format and message content.';
    } else if (error.response?.status === 402) {
      errorMessage = 'Insufficient credits. Please top up your account.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Please check your API permissions.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.response?.data?.error_code || error.response?.status || 'UNKNOWN_ERROR',
      originalError: error.message,
      provider: 'iProgSMS'
    };
  }
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
