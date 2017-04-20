const path = require('path');
const fs = require('fs');
const express = require('express');
const soap = require('soap');

const winston = require('./logger');

require('./db');

const isProduction = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;
const app = express();

const services = require('./services');
const wsdl = fs.readFileSync(__dirname + '/../Sonos.wsdl', 'utf8');

app.use(require('./controllers'));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', function(err) {
  if (err) winston.info(err);

  const listener = soap.listen(app, '/wsdl', services, wsdl);

  listener.log = function(type, data) {
    if (type === 'error') winston.error('soap error', data);
  };

  winston.info('==> 🌎 Listening on PORT %s. Open up http://0.0.0.0:%s/ in your browser.', PORT, PORT);
});

