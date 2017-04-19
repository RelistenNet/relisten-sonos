const winston = require('../logger');

module.exports = () => {
  winston.info("getLastUpdate");

  return {
    getLastUpdateResult: {
      favorites: 0,
      catalog: 0,
      pollInterval: 60
    }
  }
};
