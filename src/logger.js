var winston = require('winston');
require('winston-loggly-bulk');

if (process.env.NODE_ENV === 'production') {
   winston.add(winston.transports.Loggly, {
    token: process.env.RELISTEN_SONOS_LOGGLY_TOKEN,
    subdomain: 'relisten',
    tags: ["Winston-NodeJS"],
    json: true
  });
}

module.exports = winston;
