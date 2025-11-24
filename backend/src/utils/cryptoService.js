const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const AUTH_TAG_LENGTH = 16; 

const KEY_DIR = path.join(__dirname, '../../keys');

if (!fs.existsSync(KEY_DIR)) {
  fs.mkdirSync(KEY_DIR, { recursive: true });
}

/**
 * 
 * @returns {Buffer} 
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(KEY_LENGTH);
};

/**
 * 
 * @param {Object|string} data
 * @returns {Object} 
 */
const encryptData = (data) => {
  const key = generateEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(dataString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
    key: key.toString('hex')
  };
};

/**
 *
 * @param {Object} encryptedData 
 * @returns {Object|string} 
 */
const decryptData = (encryptedData) => {
  const { encrypted, iv, authTag, key } = encryptedData;
  
  const keyBuffer = Buffer.from(key, 'hex');
  const ivBuffer = Buffer.from(iv, 'hex');
  const authTagBuffer = Buffer.from(authTag, 'hex');
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyBuffer, ivBuffer);
  
  decipher.setAuthTag(authTagBuffer);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  try {
    return JSON.parse(decrypted);
  } catch (e) {
    return decrypted;
  }
};

/**
 * 
 * @returns {string} 
 */
const generateVoteToken = () => {

  const randomHex = crypto.randomBytes(12).toString('hex');

  const timestamp = Date.now().toString(36);
  
  return `V-${timestamp}-${randomHex}`;
};

/**
 * 
 * @param {string|Array|Object} data 
 * @returns {string} 
 */
const hashData = (data) => {
  let dataString;
  
  if (typeof data === 'string') {
    dataString = data;
  } else if (Array.isArray(data)) {
    dataString = data.join('|');
  } else if (typeof data === 'object' && data !== null) {
    dataString = JSON.stringify(data);
  } else {
    dataString = String(data);
  }
  
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

/**
 * 
 * @param {string} studentId 
 * @param {string} electionId 
 * @returns {string} 
 */
const createBlindedId = (studentId, electionId) => {
  const serverSecret = process.env.SERVER_SECRET || 'trustelectSecretSalt';
  
  return crypto
    .createHmac('sha256', `${electionId}-${serverSecret}`)
    .update(studentId.toString())
    .digest('hex');
};

module.exports = {
  encryptData,
  decryptData,
  generateVoteToken,
  hashData,
  createBlindedId
}; 