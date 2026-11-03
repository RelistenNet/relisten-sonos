import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { lookupTrack, streamUrlForTrack } from '../../relisten/tracks.js';
import { smapiHandler } from '../respond.js';

type MediaURIArgs = { id?: string };

export default (ctx: { format: string }) =>
  smapiHandler<MediaURIArgs>(
    'getMediaURI',
    async ({ id }) => {
      winston.info('getMediaURI', { type: ctx.format, id });

      const parsed = parseId(id);

      if (!parsed || parsed.kind !== 'track') {
        winston.error('unparseable getMediaURI id', { id });
        return { getMediaURIResult: '' };
      }

      const { slug, year, date, sourceId, trackId } = parsed;

      const found = await lookupTrack(slug, year, date, sourceId, trackId);

      if (!found) return { getMediaURIResult: '' };

      const { track } = found;

      const trackUrl = streamUrlForTrack(track, ctx.format, slug);

      if (trackUrl === undefined) {
        winston.error('no stream url on track', { slug, year, date, sourceId, trackId });
        return { getMediaURIResult: '' };
      }

      const result = {
        getMediaURIResult: encodeURI(trackUrl), // 'http://192.168.0.101:3001/foo.mp3', //trackUrl,
        httpHeaders: [],
      };

      winston.info('MP3 prepped', result);

      return result;
    },
    { errorResult: { getMediaURIResult: '' } }
  );
