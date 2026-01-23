const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const SecurityLog = require('../models/SecurityLog');
const logger = require('../utils/logger');
const securityConfig = require('../config/security');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip;
}

async function logSecurityEvent(type, severity, ipAddress, action, details, success = false, userId = null, errorMessage = null, userAgent = null) {
  try {
    await SecurityLog.create({
      type,
      severity,
      ipAddress,
      userId,
      action,
      details,
      userAgent,
      success,
      errorMessage
    });
  } catch (error) {
    logger.error('Failed to log security event', { error: error.message });
  }
}

function setupSecurityMiddleware(app) {
  app.use(helmet(securityConfig.helmet));
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());

  app.use((req, res, next) => {
    req.clientIp = getClientIp(req);
    next();
  });

  app.use((req, res, next) => {
    const suspiciousPatterns = [
      /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i,
      /<script|javascript:|onerror=|onload=/i,
      /union.*select|insert.*into|drop.*table/i,
      /\$ne|\$gt|\$lt|\$regex/i
    ];

    const checkString = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params
    });

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(checkString)) {
        logger.security('Suspicious request detected', {
          ip: req.clientIp,
          path: req.path,
          method: req.method,
          pattern: pattern.toString()
        });

        logSecurityEvent(
          'suspicious',
          'high',
          req.clientIp,
          'suspicious_request',
          { path: req.path, method: req.method, pattern: pattern.toString() },
          false,
          null,
          'Suspicious pattern detected',
          req.headers['user-agent']
        );

        return res.status(400).json({ 
          success: false, 
          error: 'Invalid request' 
        });
      }
    }

    next();
  });
}

module.exports = { 
  setupSecurityMiddleware, 
  getClientIp, 
  logSecurityEvent 
};
