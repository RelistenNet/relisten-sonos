const winston = require('winston');
const I = require('instrumental-agent');

const logger = winston.createLogger({
  // format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

I.configure({
  apiKey: process.env.INSTRUMENTAL_KEY,
  enabled: process.env.NODE_ENV === 'production',
});

logger.I = I;

module.exports = logger;
