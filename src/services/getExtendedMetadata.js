const winston = require('../logger');

module.exports = (type) => (args) => {
  winston.info("getExtendedMetadata", args.id);

  return {
    getExtendedMetadataResult: {
      id: args.id,
      type: 'artist'
    }
  }
};
