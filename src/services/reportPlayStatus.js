const winston = require('../logger');

const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

const reportPlayStatus = (type, id, seconds, status, callback) => {
  const [regex, slug, year, date, sourceId, trackId] = id.match(/Track\:(.*)\:(.*)\:(.*)\:(.*)\:(.*)/);

  // do nothing.. for now.
  return callback({ reportPlayStatusResult: '' });
};

module.exports = (type) => (args, callback) => {
  const { id, seconds, status } = args;

  winston.info('reportPlayStatus', type, id, status, seconds, args);
  winston.I.increment('sonos.wsdl.reportPlayStatus');
  return reportPlayStatus(type, id, seconds, status, callback);
};
