const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['verification', 'oauth', 'rate_limit', 'suspicious', 'error', 'blocked'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    default: null,
    index: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userAgent: {
    type: String,
    default: null
  },
  success: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

securityLogSchema.index({ type: 1, timestamp: -1 });
securityLogSchema.index({ ipAddress: 1, timestamp: -1 });
securityLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
