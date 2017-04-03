const mysql = require('mysql');

var connection = mysql.createConnection({
  host     : process.env.RELISTEN_DB_HOST || '127.0.0.1',
  user     : process.env.RELISTEN_DB_USER || 'root',
  database : process.env.RELISTEN_DB_NAME || 'relisten',
  password : process.env.RELISTEN_DB_PASS || ''
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
});

module.exports = connection;

