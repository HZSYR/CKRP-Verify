const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  if (trimmedEmail.length > 254) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  return trimmedEmail.endsWith('@gmail.com');
};

const sanitizeInput = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  return input.trim().substring(0, maxLength);
};

const validateDiscordId = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^\d{17,19}$/.test(id);
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation errors', { 
      errors: errors.array(),
      ip: req.clientIp 
    });
    return res.status(400).json({ 
      success: false, 
      error: errors.array()[0].msg 
    });
  }
  next();
};

module.exports = {
  validateEmail,
  sanitizeInput,
  validateDiscordId,
  handleValidationErrors
};
