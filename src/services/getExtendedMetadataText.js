const winston = require('../logger');

module.exports = (type) => (args) => {
  winston.info("getExtendedMetadataText");
  winston.I.increment("sonos.wsdl.getExtendedMetadataText");

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result'
    }
  }
};
