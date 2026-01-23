const csurf = require('csurf');

const csrfProtection = csurf({ 
  cookie: false,
  sessionKey: 'session'
});

module.exports = csrfProtection;
