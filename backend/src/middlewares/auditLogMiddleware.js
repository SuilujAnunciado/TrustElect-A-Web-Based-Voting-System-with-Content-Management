const auditLogModel = require('../models/auditLogModel');

<<<<<<< HEAD
const recentLogs = new Map();
const DUPLICATE_PREVENTION_WINDOW = 10000; 


/**
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const createAuditLog = (req, res, next) => {
=======
// Cache to store recent audit logs to prevent duplicates
const recentLogs = new Map();
const DUPLICATE_PREVENTION_WINDOW = 10000; // 10 seconds

/**
 * Create an audit log for the current request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const createAuditLog = (req, res, next) => {
  // Skip audit logging for certain routes that don't need it
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
  const skipRoutes = [
    '/api/audit-logs',
    '/api/notifications',
    '/api/system-load',
    '/api/health',
    '/api/status'
  ];

  const originalEnd = res.end;

  res.end = function(chunk, encoding) {
    res.end = originalEnd;

    res.end(chunk, encoding);
    
<<<<<<< HEAD
=======
    // Skip GET requests and specific routes
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
    if (req.method === 'GET' || skipRoutes.some(route => req.originalUrl.startsWith(route))) {
      return;
    }

    if (!req.user) {
      return;
    }
    
    try {
      const user_id = req.user.id;
      const user_email = req.user.email;
      const user_role = req.user.normalizedRole || req.user.role || 'Unknown';

      let action = req.method;
 
      const urlParts = req.originalUrl.split('/').filter(Boolean);
      const apiIndex = urlParts.findIndex(part => part === 'api');
      const entity_type = urlParts[apiIndex + 1] || 'unknown';

      let entity_id = null;

      if (urlParts.length > apiIndex + 2 && !isNaN(urlParts[apiIndex + 2])) {
        entity_id = parseInt(urlParts[apiIndex + 2], 10);
      } else if (req.params && Object.keys(req.params).length > 0) {
        const numericParams = Object.values(req.params).filter(val => !isNaN(val));
        if (numericParams.length > 0) {
          entity_id = parseInt(numericParams[0], 10);
        }
      }

<<<<<<< HEAD
=======
      // Determine action based on URL and method
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (req.originalUrl.includes('login')) {
        action = 'LOGIN';
        entity_type = 'auth';
      } else if (req.originalUrl.includes('logout')) {
        action = 'LOGOUT';
        entity_type = 'auth';
      } else if (req.method === 'POST') {
        action = 'CREATE';
      } else if (req.method === 'PUT' || req.method === 'PATCH') {
        action = 'UPDATE';
      } else if (req.method === 'DELETE') {
        action = 'DELETE';
      }

      if (urlParts.includes('approve')) {
        action = 'APPROVE';
      } else if (urlParts.includes('reject')) {
        action = 'REJECT';
      } else if (urlParts.includes('restore')) {
        action = 'RESTORE';
      } else if (urlParts.includes('unlock')) {
        action = 'UNLOCK';
      } else if (urlParts.includes('reset-password')) {
        action = 'RESET_PASSWORD';
      } else if (urlParts.includes('vote')) {
        action = 'VOTE';
      }

<<<<<<< HEAD
=======
      // Skip logging for notification-related endpoints to prevent spam
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (req.originalUrl.includes('notifications') || 
          req.originalUrl.includes('system-load') ||
          req.originalUrl.includes('health') ||
          req.originalUrl.includes('status')) {
        return;
      }

<<<<<<< HEAD
      if (req.originalUrl.includes('elections') && action === 'CREATE') {
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000); 
      const logKey = `${user_id}-${action}-${entity_type}-${entity_id}-${timestamp}`;
      const now = Date.now();
      
      const recentLog = recentLogs.get(logKey);
      if (recentLog && (now - recentLog) < 1000) {
        return; 
      }

      recentLogs.set(logKey, now);

=======
      // Special handling for election creation - only log when ballot is created
      if (req.originalUrl.includes('elections') && action === 'CREATE') {
        // Skip election creation logs - we'll log when ballot is created instead
        return;
      }

      // Create a more specific log key to prevent duplicates
      const timestamp = Math.floor(Date.now() / 1000); // Round to seconds
      const logKey = `${user_id}-${action}-${entity_type}-${entity_id}-${timestamp}`;
      const now = Date.now();
      
      // Check for very recent duplicate logs (within 1 second)
      const recentLog = recentLogs.get(logKey);
      if (recentLog && (now - recentLog) < 1000) {
        return; // Skip duplicate log
      }
      
      // Update recent logs cache
      recentLogs.set(logKey, now);
      
      // Clean up old entries from cache
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      for (const [key, timestamp] of recentLogs.entries()) {
        if (now - timestamp > DUPLICATE_PREVENTION_WINDOW) {
          recentLogs.delete(key);
        }
      }

<<<<<<< HEAD
=======
      // Only log successful operations (2xx status codes)
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      const details = {
        status: res.statusCode,
        endpoint: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      };

<<<<<<< HEAD
      if (req.body && Object.keys(req.body).length > 0 && !req.originalUrl.includes('login')) {
        const sanitizedBody = { ...req.body };

=======
      // Add request body for non-sensitive operations
      if (req.body && Object.keys(req.body).length > 0 && !req.originalUrl.includes('login')) {
        const sanitizedBody = { ...req.body };
        
        // Remove sensitive fields
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        const sensitiveFields = ['password', 'password_hash', 'token', 'otp', 'secret', 'newPassword', 'currentPassword'];
        sensitiveFields.forEach(field => {
          if (sanitizedBody[field]) {
            sanitizedBody[field] = '[REDACTED]';
          }
        });
        
        details.request = sanitizedBody;
      }

<<<<<<< HEAD
=======
      // Add specific details for important operations
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
      if (req.originalUrl.includes('ballots') && action === 'CREATE') {
        try {
          const responseData = JSON.parse(chunk);
          if (responseData.ballot) {
            details.election_id = responseData.ballot.election_id;
            details.ballot_id = responseData.ballot.id;
<<<<<<< HEAD
=======
            // This represents the complete election + ballot creation process
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
            action = 'CREATE_ELECTION_WITH_BALLOT';
            entity_type = 'elections';
            entity_id = responseData.ballot.election_id;
          }
        } catch (e) {
<<<<<<< HEAD
=======
          // Ignore parsing errors
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        }
      }

      const logData = {
        user_id,
        user_email,
        user_role,
        action,
        entity_type,
        entity_id,
        details,
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      };
      
      auditLogModel.createAuditLog(logData)
<<<<<<< HEAD
        .then(log => {     
=======
        .then(log => {
          console.log(`Audit log created: ${action} by ${user_email} (${user_role}) - ${entity_type}${entity_id ? ` #${entity_id}` : ''}`);
>>>>>>> 7ac434e8b601aa8f13314f50695a5c13d407298b
        })
        .catch(err => {
          console.error('Failed to create audit log:', err);
        });
    } catch (error) {
      console.error('Error in audit log middleware:', error);
    }
  };
  
  next();
};

const logAction = async (user, action, entityType, entityId, details = {}) => {
  try {
    if (!user || !user.id) {
      console.error('Cannot log action: Missing user information');
      return null;
    }
    
    const logData = {
      user_id: user.id,
      user_email: user.email || 'unknown',
      user_role: user.normalizedRole || user.role || 'Unknown',
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details,
      ip_address: 'direct-call',
      user_agent: 'system'
    };
    
   
    const log = await auditLogModel.createAuditLog(logData);
    return log;
  } catch (error) {
    console.error('Error in direct audit logging:', error);
    return null;
  }
};

module.exports = { createAuditLog, logAction }; 