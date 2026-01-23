module.exports = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectUri: process.env.DISCORD_REDIRECT_URI,
  
  scopes: ['identify', 'email', 'guilds.join'],
  
  apiEndpoint: 'https://discord.com/api/v10',
  
  authorizationUrl: function() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' ')
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  },
  
  tokenUrl: `https://discord.com/api/oauth2/token`,
  userUrl: `https://discord.com/api/users/@me`
};
