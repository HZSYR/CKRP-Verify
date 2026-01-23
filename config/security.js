module.exports = {
  rateLimit: {
    global: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.MAX_REQUESTS_PER_IP) || 100
    },
    oauth: {
      windowMs: 600000,
      max: 3
    },
    verification: {
      windowMs: 86400000,
      max: 1
    },
    api: {
      windowMs: 60000,
      max: 10
    }
  },
  
  token: {
    expiryMinutes: parseInt(process.env.TOKEN_EXPIRY_MINUTES) || 5,
    length: 32
  },
  
  session: {
    secret: process.env.SESSION_SECRET,
    name: 'discord.verify',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 3600000,
      sameSite: 'lax'
    }
  },
  
  cors: {
    origin: process.env.WEBSITE_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://cdn.discordapp.com"],
        connectSrc: ["'self'", "https://discord.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },
  
  maxVerificationPerDay: parseInt(process.env.MAX_VERIFICATION_PER_DAY) || 1,
  
  allowedEmailDomains: ['gmail.com'],
  
  ipBlockDuration: 3600000,
  
  requestTimeout: 30000
};
