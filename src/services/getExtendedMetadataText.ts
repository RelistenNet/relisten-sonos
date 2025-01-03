import winston from '../logger';

export default () => () => {
  winston.info('getExtendedMetadataText');
  winston.I.increment('sonos.wsdl.getExtendedMetadataText');

  return {
    getExtendedMetadataTextResult: {
      getExtendedMetadataTextResult: 'extended text result',
    },
  };
};
