import winston from '../logger';

export default () => () => {
  // winston.info('getLastUpdate');
  winston.I.increment('sonos.wsdl.getLastUpdate');

  return {
    getLastUpdateResult: {
      favorites: 0,
      catalog: 0,
      pollInterval: 60,
    },
  };
};
