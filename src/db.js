const mysql = require('mysql');
const winston = require('./logger');

var connection;
var db_config = process.env.DATABASE_URL || process.env.MYSQL_URL_INT || 'mysql://root@127.0.0.1/relisten';

var interval = -1;

function handleDisconnect() {
  connection = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  connection.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      winston.error('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
                                          // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
    else {
      if(interval != -1) {
        clearInterval(interval);
      }

      interval = setInterval(function () {
        connection.query('SELECT 1');
      }, 5000);
    }
  });                                     
  connection.on('error', function(err) {
    winston.error('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();

module.exports = connection;

