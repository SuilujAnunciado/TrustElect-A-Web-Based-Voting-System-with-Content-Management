const axios = require('axios');

const IPROGSMS_API_KEY = process.env.IPROGSMS_API_KEY
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
 
    const otpData = {
      api_token: IPROGSMS_API_KEY,
      phone_number: formattedNumber,
      otp: otp, // Include the actual OTP code as shown in documentation
      message: `Your TrustElect verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`
    };
  
    console.log('Making API request to:', `${IPROGSMS_API_URL}/otp`);
    console.log('Request data:', JSON.stringify(otpData, null, 2));
    
    // Try both endpoints from documentation
    let response = null;
    let lastError = null;
    
    const endpoints = [
      {
        url: `${IPROGSMS_API_URL}/otp`,
        data: otpData
      },
      {
        url: `${IPROGSMS_API_URL}/otp/send_otp`,
        data: {
          api_token: IPROGSMS_API_KEY,
          phone_number: formattedNumber,
          message: `Your TrustElect verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`
        }
      }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log('Trying endpoint:', endpoint.url);
        console.log('Request data:', JSON.stringify(endpoint.data, null, 2));
        
        response = await axios.post(
          endpoint.url,
          endpoint.data,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        console.log('Success with endpoint:', endpoint.url);
        break;
      } catch (error) {
        console.log('Failed with endpoint:', endpoint.url, error.response?.status);
        console.log('Error response:', error.response?.data);
        lastError = error;
        continue;
      }
    }
    
    if (!response) {
      throw lastError || new Error('All endpoints failed');
    }
    
    console.log('iProgSMS API Response Status:', response.status);
    console.log('iProgSMS API Response Headers:', response.headers);
    console.log('iProgSMS API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      const messageId = response.data?.message_id || response.data?.id || response.data?.data?.id || 'unknown';
      
      // Check if there's an error in the response data
      if (response.data?.error || response.data?.status === 'error') {
        console.error('iProgSMS API returned error in response:', response.data);
        return {
          success: false,
          error: response.data?.message || response.data?.error || 'Unknown error from iProgSMS',
          code: response.data?.error_code || 'API_ERROR',
          provider: 'iProgSMS',
          response: response.data
        };
      }
      
      return { 
        success: true, 
        messageId: messageId,
        to: formattedNumber,
        status: 'sent',
        provider: 'iProgSMS',
        cost: 'Using iProgSMS credits',
        note: 'iProgSMS generated OTP automatically',
        response: response.data
      };
    } else {
      console.error('Unexpected response status:', response.status);
      return {
        success: false,
        error: `Unexpected response status: ${response.status}`,
        code: 'UNEXPECTED_STATUS',
        provider: 'iProgSMS',
        response: response.data
      };
    }
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
 * Verify OTP using iProgSMS verify_otp endpoint
 * @param {string} phoneNumber - Phone number to verify OTP for
 * @param {string} otp - 6-digit OTP code to verify
 * @returns {Promise<Object>} - Verification result
 */
const verifyOTP = async (phoneNumber, otp) => {
  try {
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
    console.log('Verifying OTP for:', formattedNumber);
    console.log('OTP to verify:', otp);
    
    const verifyData = {
      api_token: IPROGSMS_API_KEY,
      phone_number: formattedNumber,
      otp: otp
    };
    
    console.log('Making verify API request to:', `${IPROGSMS_API_URL}/otp/verify_otp`);
    console.log('Request data:', JSON.stringify(verifyData, null, 2));
    
    const response = await axios.post(
      `${IPROGSMS_API_URL}/otp/verify_otp`,
      verifyData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('iProgSMS Verify API Response Status:', response.status);
    console.log('iProgSMS Verify API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      // Check if verification was successful
      if (response.data?.success || response.data?.verified || response.data?.status === 'success') {
        return {
          success: true,
          message: 'OTP verified successfully',
          phoneNumber: formattedNumber,
          provider: 'iProgSMS',
          response: response.data
        };
      } else {
        return {
          success: false,
          error: response.data?.message || 'OTP verification failed',
          code: response.data?.error_code || 'VERIFICATION_FAILED',
          provider: 'iProgSMS',
          response: response.data
        };
      }
    } else {
      console.error('Unexpected verify response status:', response.status);
      return {
        success: false,
        error: `Unexpected response status: ${response.status}`,
        code: 'UNEXPECTED_STATUS',
        provider: 'iProgSMS',
        response: response.data
      };
    }
  } catch (error) {
    console.error('OTP verification error:', error);
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
      errorMessage = 'Invalid OTP or phone number format.';
    } else if (error.response?.status === 404) {
      errorMessage = 'OTP not found or expired.';
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
  verifyOTP,
  sendElectionNotificationSMS,
  formatPhoneNumber
};
