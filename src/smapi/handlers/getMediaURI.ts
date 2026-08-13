import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getShow } from '../../relisten/api.js';
import { findSource, findTrack, streamUrlForTrack } from '../../relisten/tracks.js';
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

      const show = await getShow(slug, year, date);

      if (!show || !show.sources) {
        winston.error('no SONG json tracks found', {
          slug,
          year,
          date,
          sourceId,
        });
        return { getMediaURIResult: '' };
      }

      const source = findSource(show, sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', { slug, year, date, sourceId });
        return { getMediaURIResult: '' };
      }

      const track = findTrack(source, trackId);

      if (!track) return { getMediaURIResult: '' };

      const trackUrl = streamUrlForTrack(track, ctx.format, slug);

      const result = {
        getMediaURIResult: encodeURI(trackUrl), // 'http://192.168.0.101:3001/foo.mp3', //trackUrl,
        httpHeaders: [],
      };

      winston.info('MP3 prepped', result);

      return result;
    },
    { errorResult: { getMediaURIResult: '' } }
  );
