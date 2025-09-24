import getMetadata from './getMetadata.js';
import getExtendedMetadata from './getExtendedMetadata.js';
import getExtendedMetadataText from './getExtendedMetadataText.js';
import getLastUpdate from './getLastUpdate.js';
import getMediaMetadata from './getMediaMetadata.js';
import getMediaURI from './getMediaURI.js';
import search from './search.js';
import reportPlayStatus from './reportPlayStatus.js';
import reportPlaySeconds from './reportPlaySeconds.js';
import setPlayedSeconds from './setPlayedSeconds.js';

const services = (type = 'mp3') => {
  return {
    Sonos: {
      SonosSoap: {
        getMetadata: getMetadata(type),
        getExtendedMetadata: getExtendedMetadata(),
        getExtendedMetadataText: getExtendedMetadataText(),
        getLastUpdate: getLastUpdate(),
        getMediaMetadata: getMediaMetadata(type),
        getMediaURI: getMediaURI(type),
        search: search(type),
        reportPlayStatus: reportPlayStatus(type),
        reportPlaySeconds: reportPlaySeconds(type),
        setPlayedSeconds: setPlayedSeconds(type),
      },
    },
  };
};

export default services;
