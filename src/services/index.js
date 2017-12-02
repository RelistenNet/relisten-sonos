const services = (type = 'mp3') =>{

  return {
    Sonos: {
      SonosSoap: {
        getMetadata: require('./getMetadata')(type),
        getExtendedMetadata: require('./getExtendedMetadata'),
        getExtendedMetadataText: require('./getExtendedMetadataText'),
        getLastUpdate: require('./getLastUpdate'),
        getMediaMetadata: require('./getMediaMetadata')(type),
        getMediaURI: require('./getMediaURI')(type),
        search: require('./search')
      }
    }
  };
};

module.exports = services;