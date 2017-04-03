const service = {
  Sonos: {
    SonosSoap: {
      getMetadata: require('./services/getMetadata'),
      getExtendedMetadata: require('./services/getExtendedMetadata'),
      getExtendedMetadataText: require('./services/getExtendedMetadataText'),
      getLastUpdate: require('./services/getLastUpdate'),
      getMediaMetadata: require('./services/getMediaMetadata'),
      getMediaURI: require('./services/getMediaURI'),
      search: require('./services/search')
    }
  }
};

module.exports = service;