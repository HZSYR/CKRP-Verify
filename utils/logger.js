const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, data = null) {
    const timestamp = this.getTimestamp();
    let logMessage = `[${timestamp}] [${level}] ${message}`;
    if (data) {
      logMessage += `\n${JSON.stringify(data, null, 2)}`;
    }
    return logMessage;
  }

  writeToFile(level, message) {
    const filename = `${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logsDir, filename);
    fs.appendFileSync(filepath, message + '\n');
  }

  info(message, data = null) {
    const logMessage = this.formatMessage('INFO', message, data);
    console.log('\x1b[36m%s\x1b[0m', logMessage);
    this.writeToFile('INFO', logMessage);
  }

  success(message, data = null) {
    const logMessage = this.formatMessage('SUCCESS', message, data);
    console.log('\x1b[32m%s\x1b[0m', logMessage);
    this.writeToFile('SUCCESS', logMessage);
  }

  warn(message, data = null) {
    const logMessage = this.formatMessage('WARN', message, data);
    console.log('\x1b[33m%s\x1b[0m', logMessage);
    this.writeToFile('WARN', logMessage);
  }

  error(message, data = null) {
    const logMessage = this.formatMessage('ERROR', message, data);
    console.error('\x1b[31m%s\x1b[0m', logMessage);
    this.writeToFile('ERROR', logMessage);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = this.formatMessage('DEBUG', message, data);
      console.log('\x1b[35m%s\x1b[0m', logMessage);
      this.writeToFile('DEBUG', logMessage);
    }
  }

  security(message, data = null) {
    const logMessage = this.formatMessage('SECURITY', message, data);
    console.log('\x1b[31m%s\x1b[0m', logMessage);
    this.writeToFile('SECURITY', logMessage);
  }
}

module.exports = new Logger();
