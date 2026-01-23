const rateLimit = require('express-rate-limit');
const RateLimit = require('../models/RateLimit');
const logger = require('../utils/logger');
const { logSecurityEvent } = require('./security');
const securityConfig = require('../config/security');

const globalLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.global.windowMs,
  max: securityConfig.rateLimit.global.max,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Global rate limit exceeded', { ip: req.clientIp, path: req.path });
    logSecurityEvent('rate_limit', 'medium', req.clientIp, 'global_rate_limit', { path: req.path }, false, null, 'Rate limit exceeded', req.headers['user-agent']);
    res.status(429).json({ success: false, error: 'Too many requests, please try again later' });
  }
});

const oauthLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.oauth.windowMs,
  max: securityConfig.rateLimit.oauth.max,
  message: { success: false, error: 'Too many OAuth attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('OAuth rate limit exceeded', { ip: req.clientIp });
    logSecurityEvent('rate_limit', 'high', req.clientIp, 'oauth_rate_limit', {}, false, null, 'OAuth rate limit exceeded', req.headers['user-agent']);
    res.status(429).json({ success: false, error: 'Too many OAuth attempts, please try again later' });
  }
});

const apiLimiter = rateLimit({
  windowMs: securityConfig.rateLimit.api.windowMs,
  max: securityConfig.rateLimit.api.max,
  message: { success: false, error: 'Too many API requests' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', { ip: req.clientIp });
    res.status(429).json({ success: false, error: 'Too many API requests' });
  }
});

async function checkVerificationLimit(req, res, next) {
  try {
    const ipAddress = req.clientIp;
    const userId = req.session?.userId;

    const oneDayAgo = new Date(Date.now() - 86400000);

    const ipLimit = await RateLimit.findOne({
      identifier: ipAddress,
      type: 'verification',
      windowStart: { $gte: oneDayAgo }
    });

    if (ipLimit && ipLimit.count >= securityConfig.maxVerificationPerDay) {
      logger.warn('Verification limit exceeded for IP', { ip: ipAddress });
      logSecurityEvent('rate_limit', 'high', ipAddress, 'verification_limit', {}, false, userId, 'Daily verification limit exceeded', req.headers['user-agent']);
      return res.status(429).json({ 
        success: false, 
        error: 'You can only verify once per day' 
      });
    }

    if (userId) {
      const userLimit = await RateLimit.findOne({
        identifier: userId,
        type: 'verification',
        windowStart: { $gte: oneDayAgo }
      });

      if (userLimit && userLimit.count >= securityConfig.maxVerificationPerDay) {
        logger.warn('Verification limit exceeded for user', { userId });
        logSecurityEvent('rate_limit', 'high', ipAddress, 'verification_limit', {}, false, userId, 'Daily verification limit exceeded', req.headers['user-agent']);
        return res.status(429).json({ 
          success: false, 
          error: 'You can only verify once per day' 
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Rate limit check error', { error: error.message });
    next();
  }
}

async function recordVerificationAttempt(identifier, type) {
  try {
    const oneDayAgo = new Date(Date.now() - 86400000);
    
    let record = await RateLimit.findOne({
      identifier,
      type,
      windowStart: { $gte: oneDayAgo }
    });

    if (record) {
      record.count += 1;
      await record.save();
    } else {
      await RateLimit.create({
        identifier,
        type,
        count: 1,
        windowStart: new Date()
      });
    }
  } catch (error) {
    logger.error('Failed to record verification attempt', { error: error.message });
  }
}

module.exports = {
  globalLimiter,
  oauthLimiter,
  apiLimiter,
  checkVerificationLimit,
  recordVerificationAttempt
};
