// Vercel serverless function for OAuth callback
export default async function handler(req, res) {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #2c2f33; color: white; }
          .container { max-width: 500px; margin: 0 auto; }
          h1 { color: #ff0000; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Verification Failed</h1>
          <p>OAuth authorization was denied or failed.</p>
          <p>Please try again.</p>
        </div>
      </body>
      </html>
    `);
  }
  
  if (!code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #2c2f33; color: white; }
          .container { max-width: 500px; margin: 0 auto; }
          h1 { color: #ff0000; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ No Authorization Code</h1>
          <p>No authorization code received from Discord.</p>
          <p>Please try again.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '1463846789646909616',
        client_secret: 'B7Ri7TRpaXMLFLOwKkDqTdXyZc9pULd9',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://ckrp-verify.vercel.app/oauth/callback'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    // Get user guilds
    const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userGuilds = guildsResponse.data || [];
    const targetGuild = userGuilds.find(guild => guild.id === '1463219682013348000');

    if (!targetGuild) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #2c2f33; color: white; }
            .container { max-width: 500px; margin: 0 auto; }
            h1 { color: #ff0000; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Not in Server</h1>
            <p>You must be a member of CERITA KITA ROLEPLAY server to verify.</p>
            <p>Please join the server first, then try again.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Send verification data to bot API (we'll use webhook or direct API call)
    const verificationData = {
      userId: userData.id,
      username: userData.username,
      discriminator: userData.discriminator || '0',
      email: userData.email,
      avatar: userData.avatar,
      guildId: '1463219682013348000',
      timestamp: new Date().toISOString()
    };

    // For now, we'll show success and let the bot process via MongoDB polling
    // Store in a simple way that bot can pick up
    
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Submitted</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #2c2f33; color: white; }
          .container { max-width: 500px; margin: 0 auto; }
          h1 { color: #00ff00; }
          .loader { 
            border: 4px solid #f3f3f3;
            border-top: 4px solid #00ff00;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <h1>✅ Verification Data Collected</h1>
          <p><strong>Username:</strong> ${userData.username}#${userData.discriminator || '0'}</p>
          <p><strong>Email:</strong> ${userData.email || 'Not provided'}</p>
          <p>Bot is now processing your verification...</p>
          <p><strong>Gmail Check:</strong> ${userData.email && userData.email.endsWith('@gmail.com') ? '✅ Valid Gmail' : '❌ Not Gmail - Will be rejected'}</p>
          <p>You can close this window.</p>
          
          <script>
            // Send data to MongoDB via webhook or API
            fetch('/api/store-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(${JSON.stringify(verificationData)})
            }).catch(console.error);
          </script>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #2c2f33; color: white; }
          .container { max-width: 500px; margin: 0 auto; }
          h1 { color: #ff0000; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Processing Error</h1>
          <p>An error occurred while processing your verification.</p>
          <p>Please try again later.</p>
        </div>
      </body>
      </html>
    `);
  }
}
