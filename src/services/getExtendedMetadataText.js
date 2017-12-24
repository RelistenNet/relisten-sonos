const winston = require('../logger');

module.exports = (type) => (args) => {
  winston.info("getExtendedMetadataText");

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result'
    }
  }
};
