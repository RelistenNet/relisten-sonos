const winston = require('../logger');

module.exports = () => () => {
  winston.info('getExtendedMetadataText');
  winston.I.increment('sonos.wsdl.getExtendedMetadataText');

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result'
    }
  };
};
