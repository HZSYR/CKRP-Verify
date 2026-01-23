const logger = require('../utils/logger');
const { logSecurityEvent } = require('./security');

function errorHandler(err, req, res, next) {
  logger.error('Error handler caught error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.clientIp
  });

  logSecurityEvent(
    'error',
    'medium',
    req.clientIp || 'unknown',
    'error_occurred',
    { path: req.path, method: req.method },
    false,
    req.session?.userId,
    err.message,
    req.headers['user-agent']
  );

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}

module.exports = { errorHandler, notFoundHandler };
