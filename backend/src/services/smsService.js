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
 * @param {string} phoneNumber 
 * @param {string} otp 
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
    
    // Use only the send_otp endpoint to avoid duplicate SMS
    const smsData = {
      api_token: IPROGSMS_API_KEY,
      phone_number: formattedNumber,
      message: `Your TrustElect verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`
    };
    
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
 * @param {number} userId - User ID for database validation
 * @returns {Promise<Object>} - Verification result
 */
const verifyOTP = async (phoneNumber, otp, userId = null) => {
  try {
    // Validate OTP format first
    if (!otp || typeof otp !== 'string') {
      return {
        success: false,
        error: 'OTP is required and must be a string.',
        code: 'INVALID_OTP_FORMAT'
      };
    }
    
    // Clean and validate OTP (remove spaces, ensure it's 6 digits)
    const cleanOtp = otp.toString().trim().replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanOtp)) {
      return {
        success: false,
        error: 'OTP must be exactly 6 digits.',
        code: 'INVALID_OTP_FORMAT'
      };
    }
    
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
    console.log('OTP to verify:', cleanOtp);
    
    // If userId is provided, validate OTP exists in database first
    if (userId) {
      const pool = require('../config/db');
      const dbOtpQuery = `
        SELECT id, otp, expires_at, attempts, verified FROM otps 
        WHERE user_id = $1 
        AND expires_at > NOW() 
        AND verified = false
        AND attempts < 5
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      
      const dbOtpResult = await pool.query(dbOtpQuery, [userId]);
      
      if (dbOtpResult.rows.length === 0) {
        console.log('No valid OTP found in database for user:', userId);
        return {
          success: false,
          error: 'No valid OTP found. Please request a new verification code.',
          code: 'OTP_NOT_FOUND'
        };
      }
      
      const dbOtpRecord = dbOtpResult.rows[0];
      
      // Verify OTP matches what was sent
      if (dbOtpRecord.otp !== cleanOtp) {
        console.log('OTP mismatch - database OTP:', dbOtpRecord.otp, 'provided OTP:', cleanOtp);
        // Increment attempts for wrong OTP
        await pool.query(
          'UPDATE otps SET attempts = attempts + 1 WHERE id = $1',
          [dbOtpRecord.id]
        );
        return {
          success: false,
          error: 'Invalid OTP code. Please check and try again.',
          code: 'INVALID_OTP'
        };
      }
      
      console.log('OTP validated against database record');
    }
    
    const verifyData = {
      api_token: IPROGSMS_API_KEY,
      phone_number: formattedNumber,
      otp: cleanOtp
    };
    
    console.log('Making verify API request to:', `${IPROGSMS_API_URL}/otp/verify_otp`);
    console.log('Request data:', JSON.stringify(verifyData, null, 2));
    console.log('API Key present:', !!IPROGSMS_API_KEY);
    console.log('API Key length:', IPROGSMS_API_KEY ? IPROGSMS_API_KEY.length : 0);
    
    let response;
    let apiError = null;
    
    try {
      // Try iProgSMS API first
      response = await axios.post(
        `${IPROGSMS_API_URL}/otp/verify_otp`,
        verifyData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('iProgSMS API failed, using database verification as fallback');
      console.log('API Error:', error.response?.data || error.message);
      apiError = error;
      
      // If API fails, fall back to database-only verification for security
      // This ensures the system still works even if iProgSMS is down
      if (userId) {
        const pool = require('../config/db');
        const dbOtpQuery = `
          SELECT id, otp, expires_at, attempts, verified FROM otps 
          WHERE user_id = $1 
          AND otp = $2
          AND expires_at > NOW() 
          AND verified = false
          AND attempts < 5
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const dbOtpResult = await pool.query(dbOtpQuery, [userId, cleanOtp]);
        
        if (dbOtpResult.rows.length === 0) {
          return {
            success: false,
            error: 'Invalid or expired OTP code. Please check and try again.',
            code: 'INVALID_OTP',
            provider: 'Database_Fallback'
          };
        }
        
        const dbOtpRecord = dbOtpResult.rows[0];
        
        // Mark OTP as verified in database
        await pool.query(
          'UPDATE otps SET verified = TRUE WHERE id = $1',
          [dbOtpRecord.id]
        );
        
        return {
          success: true,
          message: 'OTP verified successfully',
          phoneNumber: formattedNumber,
          provider: 'Database_Fallback',
          note: 'Verified using database fallback due to API unavailability'
        };
      } else {
        // If no userId provided, we can't verify without API
        throw error;
      }
    }
    
    console.log('iProgSMS Verify API Response Status:', response.status);
    console.log('iProgSMS Verify API Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      // Check if verification was successful
      if (response.data?.success || response.data?.verified || response.data?.status === 'success') {
        // If userId is provided, mark OTP as verified in database
        if (userId) {
          const pool = require('../config/db');
          await pool.query(
            'UPDATE otps SET verified = TRUE WHERE user_id = $1 AND otp = $2 AND verified = FALSE',
            [userId, cleanOtp]
          );
          console.log('OTP marked as verified in database');
        }
        
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
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    // Handle specific iProgSMS errors
    let errorMessage = error.message;
    let errorCode = error.response?.status || 'UNKNOWN_ERROR';
    
    // Check the response data for specific error messages
    const responseData = error.response?.data;
    if (responseData) {
      console.log('iProgSMS Error Response Data:', JSON.stringify(responseData, null, 2));
      
      if (responseData.message && responseData.message.includes('expired')) {
        errorMessage = 'OTP has expired. Please request a new one.';
        errorCode = 'OTP_EXPIRED';
      } else if (responseData.message && responseData.message.includes('invalid')) {
        errorMessage = 'Invalid OTP code. Please check and try again.';
        errorCode = 'INVALID_OTP';
      } else if (responseData.message) {
        errorMessage = responseData.message;
        errorCode = responseData.error_code || errorCode;
      } else if (responseData.error) {
        errorMessage = responseData.error;
        errorCode = responseData.error_code || errorCode;
      }
    }
    
    // Handle HTTP status codes
    if (error.response?.status === 401) {
      // Check if it's actually an OTP expiration vs authentication failure
      if (responseData?.message && responseData.message.includes('expired')) {
        errorMessage = 'OTP has expired. Please request a new one.';
        errorCode = 'OTP_EXPIRED';
      } else {
        errorMessage = 'iProgSMS authentication failed. Please check your API key.';
        errorCode = 'AUTH_FAILED';
      }
    } else if (error.response?.status === 400) {
      // More specific error message for 400 errors
      if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (responseData?.error) {
        errorMessage = responseData.error;
      } else {
        errorMessage = 'Invalid OTP or phone number format. Please check your input.';
      }
      errorCode = 'INVALID_REQUEST';
    } else if (error.response?.status === 404) {
      errorMessage = 'OTP not found or expired.';
      errorCode = 'OTP_NOT_FOUND';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Please check your API permissions.';
      errorCode = 'ACCESS_DENIED';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: errorCode,
      originalError: error.message,
      provider: 'iProgSMS',
      responseData: responseData
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
