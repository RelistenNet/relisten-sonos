import getMediaMetadata from './handlers/getMediaMetadata.js';
import getMediaURI from './handlers/getMediaURI.js';
import getMetadata from './handlers/getMetadata.js';
import { getExtendedMetadata, getExtendedMetadataText, getLastUpdate } from './handlers/misc.js';
import { reportPlaySeconds, reportPlayStatus, setPlayedSeconds } from './handlers/reporting.js';
import search from './handlers/search.js';

export type ServiceContext = { format: 'mp3' | 'flac' };

const buildServices = (ctx: ServiceContext) => {
  return {
    Sonos: {
      SonosSoap: {
        getMetadata: getMetadata(ctx),
        getExtendedMetadata,
        getExtendedMetadataText,
        getLastUpdate,
        getMediaMetadata: getMediaMetadata(ctx),
        getMediaURI: getMediaURI(ctx),
        search: search(ctx),
        reportPlayStatus,
        reportPlaySeconds,
        setPlayedSeconds,
      },
    },
  };
};

export default buildServices;
