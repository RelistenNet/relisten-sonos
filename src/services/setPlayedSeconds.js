const winston = require('../logger');

const setPlaySeconds = (type, id, seconds, status, callback) => {
  // do nothing.. for now.
  return callback({ setPlayedSecondsResult: '' });
};

module.exports = (type) => (args, callback) => {
  const { id, seconds, status } = args;

  winston.info('setPlayedSeconds', type, id, status, seconds, args);
  winston.I.increment('sonos.wsdl.setPlayedSeconds');

  return setPlaySeconds(type, id, seconds, status, callback);
};
