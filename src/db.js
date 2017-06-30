const mysql = require('mysql');
const winston = require('./logger');

var connection = mysql.createConnection(process.env.DATABASE_URL || process.env.MYSQL_URL_INT || 'mysql://root@127.0.0.1/relisten');

connection.connect(function(err) {
  if (err) {
    winston.error('error connecting: ' + err.stack);
    return;
  }
});

module.exports = connection;

