import winston from '../../logger.js';

// These three answer synchronously: node-soap uses a handler's return value
// whenever it is not undefined.

export const getLastUpdate = () => {
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

export const getExtendedMetadata = (args: { id?: string }) => {
  // winston.info('getExtendedMetadata', args.id);
  winston.I.increment('sonos.wsdl.getExtendedMetadata');

  return {
    getExtendedMetadataResult: {
      id: args.id,
      type: 'artist',
    },
  };
};

export const getExtendedMetadataText = () => {
  winston.info('getExtendedMetadataText');
  winston.I.increment('sonos.wsdl.getExtendedMetadataText');

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result',
    },
  };
};
