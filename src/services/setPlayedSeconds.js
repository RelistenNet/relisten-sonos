const winston = require('../logger');

const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

const setPlaySeconds = (type, id, seconds, status, callback) => {
  const [regex, slug, year, date, sourceId, trackId] = id.match(/Track\:(.*)\:(.*)\:(.*)\:(.*)\:(.*)/);

  // do nothing.. for now.
  return callback({ setPlayedSecondsResult: '' });
}

module.exports = (type) => (args, callback) => {
  const { id, seconds, status } = args;

  winston.info("setPlayedSeconds", type, id, status, seconds, args);
  winston.I.increment('sonos.wsdl.setPlayedSeconds');

  return setPlaySeconds(type, id, seconds, status, callback);
};
