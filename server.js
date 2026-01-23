require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const connectDatabase = require('./config/database');
const securityConfig = require('./config/security');
const logger = require('./utils/logger');
const { setupSecurityMiddleware } = require('./middleware/security');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const verifyRoutes = require('./routes/verify');
const healthRoutes = require('./routes/health');

const app = express();

connectDatabase();

setupSecurityMiddleware(app);

app.use(compression());
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(session({
  secret: securityConfig.session.secret,
  name: securityConfig.session.name,
  resave: securityConfig.session.resave,
  saveUninitialized: securityConfig.session.saveUninitialized,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600,
    crypto: {
      secret: securityConfig.session.secret
    }
  }),
  cookie: securityConfig.session.cookie
}));

app.use(globalLimiter);

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true
}));

app.use('/', authRoutes);
app.use('/', verifyRoutes);
app.use('/', healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.success(`Website server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Website URL: http://localhost:${PORT}`);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { error: error.message, stack: error.stack });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
