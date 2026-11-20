import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getV4Artist, getV4Track } from '../../relisten/api.js';
import { findLegacyTrack, streamUrlForTrack } from '../../relisten/tracks.js';
import { smapiHandler } from '../respond.js';

type MediaURIArgs = { id?: string };

const getTrackStream = async (id: string | undefined, format: string) => {
  const parsed = parseId(id);
  if (parsed?.kind === 'track') {
    const found = await findLegacyTrack(parsed);
    return found && streamUrlForTrack(found.track, format, parsed.slug);
  }
  if (parsed?.kind === 'uuidTrack') {
    const track = await getV4Track(parsed.trackId);
    if (!track) return undefined;
    const artist = await getV4Artist(track.artist_id);
    return streamUrlForTrack(track, format, artist.slug);
  }
};

export default (ctx: { format: string }) =>
  smapiHandler<MediaURIArgs>(
    'getMediaURI',
    async ({ id }) => {
      winston.info('getMediaURI', { type: ctx.format, id });

      const trackUrl = await getTrackStream(id, ctx.format);
      if (!trackUrl) {
        winston.info('no stream url for getMediaURI', { id });
        return { getMediaURIResult: '' };
      }

      const result = {
        getMediaURIResult: encodeURI(trackUrl),
        httpHeaders: [],
      };

      winston.info('MP3 prepped', result);

      return result;
    },
    { errorResult: { getMediaURIResult: '' } }
  );
