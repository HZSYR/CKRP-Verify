const express = require('express');
const router = express.Router();

const discordConfig = require('../config/discord');
const logger = require('../utils/logger');

router.get('/verify', (req, res) => {
  try {
    const guildId = req.query.guild_id;
    
    if (guildId) {
      req.session.guildId = guildId;
    }

    const authUrl = discordConfig.authorizationUrl();
    
    logger.info('Verify endpoint accessed', { 
      ip: req.clientIp,
      guildId 
    });

    res.redirect(authUrl);
  } catch (error) {
    logger.error('Verify endpoint error', { error: error.message });
    res.redirect('/error.html?error=verification_failed');
  }
});

module.exports = router;
