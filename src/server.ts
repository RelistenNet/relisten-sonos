import path from 'path';
import fs from 'fs';
import express from 'express';
import * as soap from 'soap';

import winston from './logger';
import controllers from './controllers';

const PORT = Number(process.env.PORT) || 3000;
const app = express();

import services from './services';
const wsdl = fs.readFileSync(__dirname + '/../Sonos.wsdl', 'utf8');

app.use(controllers);
app.use('/static', express.static(path.join(__dirname, 'public')));

process.on('unhandledRejection', (err) => {
  console.error('unhandledRejection', err);
  winston.error('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
  winston.error('uncaughtException');
});

app.listen(PORT, '0.0.0.0', () => {
  const listener = soap.listen(app, '/wsdl', services('mp3'), wsdl); // only here for posterity
  const mp3Listener = soap.listen(app, '/mp3', services('mp3'), wsdl);
  const flacListener = soap.listen(app, '/flac', services('flac'), wsdl);

  listener.log = function (type, data) {
    if (type === 'error') winston.error('soap error mp3', { data, error: new Error().stack });
  };

  mp3Listener.log = function (type, data) {
    if (type === 'error') winston.error('soap error mp3', { data, error: new Error().stack });
  };

  flacListener.log = function (type, data) {
    if (type === 'error') winston.error('soap error flac', { data, error: new Error().stack });
  };

  winston.info(`==> 🌎 Listening on PORT ${PORT}`);
});
