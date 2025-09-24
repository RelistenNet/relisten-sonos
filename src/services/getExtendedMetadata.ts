import winston from '../logger.js';

export default () => (args) => {
  // winston.info('getExtendedMetadata', args.id);
  winston.I.increment('sonos.wsdl.getExtendedMetadata');

  return {
    getExtendedMetadataResult: {
      id: args.id,
      type: 'artist',
    },
  };
};
