const axios = require('axios');
const encryption = require('./encryption');
const logger = require('./logger');

class ApiClient {
  constructor() {
    this.botApiUrl = process.env.BOT_API_URL;
    this.botApiSecret = process.env.BOT_API_SECRET;
  }

  async sendVerification(data) {
    try {
      const timestamp = Date.now().toString();
      const payload = JSON.stringify(data) + timestamp;
      const signature = encryption.generateHmac(payload, this.botApiSecret);

      const response = await axios.post(this.botApiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': this.botApiSecret,
          'X-Signature': signature,
          'X-Timestamp': timestamp
        },
        timeout: 30000
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error('Bot API request failed', {
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        error: error.response?.data?.error || 'Failed to communicate with bot'
      };
    }
  }

  async checkBotHealth() {
    try {
      const healthUrl = this.botApiUrl.replace('/api/verify', '/health');
      const response = await axios.get(healthUrl, { timeout: 5000 });
      return response.data.status === 'ok';
    } catch (error) {
      logger.error('Bot health check failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new ApiClient();
