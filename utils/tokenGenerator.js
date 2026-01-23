const crypto = require('crypto');
const Token = require('../models/Token');
const encryption = require('./encryption');
const securityConfig = require('../config/security');

class TokenGenerator {
  generateToken() {
    return crypto.randomBytes(securityConfig.token.length).toString('hex');
  }

  async createToken(userId, guildId, ipAddress) {
    const token = this.generateToken();
    const hashedToken = encryption.hash(token);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + securityConfig.token.expiryMinutes);

    await Token.create({
      token: hashedToken,
      userId,
      guildId,
      ipAddress,
      expiresAt
    });

    return token;
  }

  async validateToken(token, userId, guildId, ipAddress) {
    const hashedToken = encryption.hash(token);
    
    const tokenDoc = await Token.findOne({
      token: hashedToken,
      userId,
      guildId
    });

    if (!tokenDoc) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    if (tokenDoc.used) {
      return { valid: false, error: 'Token already used' };
    }

    if (tokenDoc.expiresAt < new Date()) {
      return { valid: false, error: 'Token expired' };
    }

    if (tokenDoc.ipAddress !== ipAddress) {
      return { valid: false, error: 'IP address mismatch' };
    }

    return { valid: true, token: tokenDoc };
  }

  async markTokenAsUsed(token) {
    const hashedToken = encryption.hash(token);
    await Token.updateOne(
      { token: hashedToken },
      { $set: { used: true } }
    );
  }

  async cleanupExpiredTokens() {
    const result = await Token.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
  }
}

module.exports = new TokenGenerator();
