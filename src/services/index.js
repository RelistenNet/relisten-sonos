const services = {
  Sonos: {
    SonosSoap: {
      getMetadata: require('./getMetadata'),
      getExtendedMetadata: require('./getExtendedMetadata'),
      getExtendedMetadataText: require('./getExtendedMetadataText'),
      getLastUpdate: require('./getLastUpdate'),
      getMediaMetadata: require('./getMediaMetadata'),
      getMediaURI: require('./getMediaURI'),
      search: require('./search')
    }
  }
};

module.exports = services;