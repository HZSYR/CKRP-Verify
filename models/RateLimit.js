const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['ip', 'user', 'oauth', 'verification'],
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  windowStart: {
    type: Date,
    default: Date.now
  },
  blocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400
  }
});

rateLimitSchema.index({ identifier: 1, type: 1 });
rateLimitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('RateLimit', rateLimitSchema);
