const winston = require('../logger');

module.exports = (args) => {
  winston.info("getExtendedMetadataText");

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result'
    }
  }
};
