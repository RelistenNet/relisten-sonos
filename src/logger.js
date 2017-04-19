var winston = require('winston');
require('winston-loggly-bulk');

if (process.env.NODE_ENV === 'production') {
   winston.add(winston.transports.Loggly, {
      token: process.env.LOGGLY_RELISTEN_TOKEN,
      subdomain: "relisten",
      tags: ["Winston-NodeJS"],
      json:true
  });
}

module.exports = winston;
