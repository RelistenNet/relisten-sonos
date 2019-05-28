const services = (type = 'mp3') => {
  return (
    {
      Sonos: {
        SonosSoap: {
          getMetadata: require('./getMetadata')(type),
          getExtendedMetadata: require('./getExtendedMetadata')(type),
          getExtendedMetadataText: require('./getExtendedMetadataText')(type),
          getLastUpdate: require('./getLastUpdate')(type),
          getMediaMetadata: require('./getMediaMetadata')(type),
          getMediaURI: require('./getMediaURI')(type),
          search: require('./search')(type),
          reportPlayStatus: require('./reportPlayStatus')(type),
          reportPlaySeconds: require('./reportPlaySeconds')(type),
          setPlayedSeconds: require('./setPlayedSeconds')(type),
        },
      },
    }
  );
};

module.exports = services;
