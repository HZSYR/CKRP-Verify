const express = require('express');
const axios = require('axios');
const router = express.Router();

const discordConfig = require('../config/discord');
const tokenGenerator = require('../utils/tokenGenerator');
const apiClient = require('../utils/apiClient');
const logger = require('../utils/logger');
const { validateEmail } = require('../middleware/validator');
const { logSecurityEvent } = require('../middleware/security');
const { oauthLimiter, checkVerificationLimit, recordVerificationAttempt } = require('../middleware/rateLimiter');

router.get('/auth/discord', oauthLimiter, (req, res) => {
  try {
    const guildId = req.query.guild_id || process.env.DEFAULT_GUILD_ID;
    
    if (guildId) {
      req.session.guildId = guildId;
    }

    const authUrl = discordConfig.authorizationUrl();
    
    logger.info('Redirecting to Discord OAuth', { 
      ip: req.clientIp,
      guildId 
    });

    res.redirect(authUrl);
  } catch (error) {
    logger.error('Auth redirect error', { error: error.message });
    res.redirect('/error.html?error=auth_failed');
  }
});

router.get('/callback', oauthLimiter, checkVerificationLimit, async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error) {
      logger.warn('OAuth error from Discord', { error, ip: req.clientIp });
      return res.redirect('/error.html?error=oauth_denied');
    }

    if (!code) {
      logger.warn('No code in OAuth callback', { ip: req.clientIp });
      return res.redirect('/error.html?error=invalid_callback');
    }

    const tokenResponse = await axios.post(
      discordConfig.tokenUrl,
      new URLSearchParams({
        client_id: discordConfig.clientId,
        client_secret: discordConfig.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: discordConfig.redirectUri
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, token_type } = tokenResponse.data;

    const userResponse = await axios.get(discordConfig.userUrl, {
      headers: { Authorization: `${token_type} ${access_token}` }
    });

    const userData = userResponse.data;
    const { id: userId, username, email, avatar, discriminator } = userData;

    if (!email) {
      logger.warn('No email from Discord', { userId, ip: req.clientIp });
      logSecurityEvent('oauth', 'medium', req.clientIp, 'no_email', { userId }, false, userId, 'No email provided', req.headers['user-agent']);
      return res.redirect('/error.html?error=no_email');
    }

    if (!validateEmail(email)) {
      logger.warn('Invalid email domain', { userId, email, ip: req.clientIp });
      logSecurityEvent('oauth', 'medium', req.clientIp, 'invalid_email', { userId, email }, false, userId, 'Only @gmail.com emails accepted', req.headers['user-agent']);
      return res.redirect('/error.html?error=invalid_email');
    }

    const guildId = req.session.guildId || process.env.DEFAULT_GUILD_ID;
    if (!guildId) {
      logger.error('No guild ID available', { userId });
      return res.redirect('/error.html?error=no_guild');
    }

    const token = await tokenGenerator.createToken(userId, guildId, req.clientIp);

    const fullUsername = discriminator !== '0' ? `${username}#${discriminator}` : username;
    const avatarUrl = avatar 
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`
      : null;

    const verificationData = {
      userId,
      guildId,
      username: fullUsername,
      email,
      avatar: avatarUrl,
      ipAddress: req.clientIp,
      token
    };

    const result = await apiClient.sendVerification(verificationData);

    if (!result.success) {
      logger.error('Bot API verification failed', { 
        userId, 
        error: result.error 
      });
      logSecurityEvent('verification', 'high', req.clientIp, 'verification_failed', { userId, error: result.error }, false, userId, result.error, req.headers['user-agent']);
      return res.redirect(`/error.html?error=${encodeURIComponent(result.error)}`);
    }

    await recordVerificationAttempt(req.clientIp, 'verification');
    await recordVerificationAttempt(userId, 'verification');

    logger.success('Verification successful', { 
      userId, 
      username: fullUsername,
      email,
      ip: req.clientIp 
    });

    logSecurityEvent('verification', 'low', req.clientIp, 'verification_success', { userId, username: fullUsername, email }, true, userId, null, req.headers['user-agent']);

    res.redirect('/success.html');

  } catch (error) {
    logger.error('Callback error', { 
      error: error.message,
      stack: error.stack,
      ip: req.clientIp
    });

    logSecurityEvent('error', 'high', req.clientIp, 'callback_error', { error: error.message }, false, null, error.message, req.headers['user-agent']);

    res.redirect('/error.html?error=verification_failed');
  }
});

module.exports = router;
