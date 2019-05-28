const path = require('path');
const fs = require('fs');
const express = require('express');
const soap = require('soap');
require('isomorphic-fetch');

const winston = require('./logger');

const PORT = process.env.PORT || 3000;
const app = express();

const services = require('./services');
const wsdl = fs.readFileSync(__dirname + '/../Sonos.wsdl', 'utf8');

app.use(require('./controllers'));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', (err) => {
  if (err) winston.info(err);

  const listener = soap.listen(app, '/wsdl', services('mp3'), wsdl); // only here for posterity
  const mp3Listener = soap.listen(app, '/mp3', services('mp3'), wsdl);
  const flacListener = soap.listen(app, '/flac', services('flac'), wsdl);

  listener.log = function(type, data) {
    if (type === 'error') winston.error('soap error mp3', { data, error: new Error().stack });
  };

  mp3Listener.log = function(type, data) {
    if (type === 'error') winston.error('soap error mp3', { data, error: new Error().stack });
  };

  flacListener.log = function(type, data) {
    if (type === 'error') winston.error('soap error flac', { data, error: new Error().stack });
  };

  winston.info(`==> 🌎 Listening on PORT ${PORT}`);
});
