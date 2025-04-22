import winston from '../logger';

const reportPlayStatus = (type, id, seconds, status, callback) => {
  // do nothing.. for now.
  return callback({ reportPlayStatusResult: '' });
};

export default (type) => (args, callback) => {
  const { id, seconds, status } = args;

  winston.info('reportPlayStatus', { type, id, status, seconds, args });
  winston.I.increment('sonos.wsdl.reportPlayStatus');
  return reportPlayStatus(type, id, seconds, status, callback);
};
