const path = require('path');
const fs = require('fs');
const express = require('express');
const soap = require('soap');

require('./db');

const isProduction = process.env.NODE_ENV !== 'production';
const PORT = isProduction ? 3000 : process.env.PORT;
const app = express();

const service = require('./service');
const wsdl = fs.readFileSync(__dirname + '/../Sonos.wsdl', 'utf8');

app.use(require('./controllers'));

app.listen(PORT, '127.0.0.1', function(err) {
  if (err) console.log(err);

  const listener = soap.listen(app, '/wsdl', service, wsdl);

  listener.log = function(type, data) {
    console.log(type, data);
  };

  console.info('==> 🌎 Listening on PORT %s. Open up http://127.0.0.1:%s/ in your browser.', PORT, PORT);
});

