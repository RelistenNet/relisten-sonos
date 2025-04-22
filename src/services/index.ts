import getMetadata from './getMetadata';
import getExtendedMetadata from './getExtendedMetadata';
import getExtendedMetadataText from './getExtendedMetadataText';
import getLastUpdate from './getLastUpdate';
import getMediaMetadata from './getMediaMetadata';
import getMediaURI from './getMediaURI';
import search from './search';
import reportPlayStatus from './reportPlayStatus';
import reportPlaySeconds from './reportPlaySeconds';
import setPlayedSeconds from './setPlayedSeconds';

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
