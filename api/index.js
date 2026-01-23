require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const compression = require('compression');
const path = require('path');

const connectDatabase = require('../config/database');
const { setupSecurityMiddleware } = require('../middleware/security');
const { globalLimiter } = require('../middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');

const authRoutes = require('../routes/auth');
const verifyRoutes = require('../routes/verify');
const healthRoutes = require('../routes/health');

const app = express();

// Connect to database
connectDatabase();

// Security middleware
setupSecurityMiddleware(app);

// Compression
app.use(compression());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Rate limiting
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/auth', authRoutes);
app.use('/api', verifyRoutes);
app.use('/health', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Export for Vercel
module.exports = app;
