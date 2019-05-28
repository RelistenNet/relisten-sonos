const winston = require('winston');
const I = require('instrumental-agent');

I.configure({
  apiKey: process.env.INSTRUMENTAL_KEY,
  enabled: process.env.NODE_ENV === 'production'
});

winston.I = I;

module.exports = winston;
