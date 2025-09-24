import winston from '../logger.js';

export default () => () => {
  winston.info('getExtendedMetadataText');
  winston.I.increment('sonos.wsdl.getExtendedMetadataText');

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result',
    },
  };
};
