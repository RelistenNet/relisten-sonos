const mysql = require('mysql');

var connection = mysql.createConnection(process.env.MYSQL_URL_INT || 'mysql://root@127.0.0.1/relisten');

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
});

module.exports = connection;

