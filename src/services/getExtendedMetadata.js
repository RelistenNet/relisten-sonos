const winston = require('../logger');

module.exports = (args) => {
  winston.info("getExtendedMetadata", args.id);

  return {
    getExtendedMetadataResult: {
      id: args.id,
      type: 'artist'
    }
  }
};
