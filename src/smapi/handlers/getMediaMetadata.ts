import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getShow } from '../../relisten/api.js';
import { getArtistName } from '../../relisten/artists.js';
import { findSource, findTrack } from '../../relisten/tracks.js';
import { trackMetadata } from '../presenters.js';
import { smapiHandler } from '../respond.js';

type MediaMetadataArgs = { id?: string };

const handle = (ctx: { format: string }) =>
  smapiHandler<MediaMetadataArgs>(
    'getMediaMetadata',
    async ({ id }) => {
      const parsed = parseId(id);

      if (!parsed || parsed.kind !== 'track') {
        winston.error('unparseable getMediaMetadata id', { id });
        return { getMediaMetadataResult: {} };
      }

      const { slug, year, date, sourceId, trackId } = parsed;

      const artistName = await getArtistName(slug);
      const show = await getShow(slug, year, date);

      if (!show || !show.sources) {
        winston.error('no SONG json tracks found', { slug, year, date, sourceId });
        return { getMediaMetadataResult: {} };
      }

      const source = findSource(show, sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', { slug, year, date, sourceId });
        return { getMediaMetadataResult: {} };
      }

      const track = findTrack(source, trackId);

      if (!track) return { getMediaMetadataResult: {} };

      return {
        getMediaMetadataResult: trackMetadata({
          id,
          slug,
          year,
          date,
          sourceId,
          artistName,
          show,
          track,
          format: ctx.format,
        }),
      };
    },
    { errorResult: { getMediaMetadataResult: {} } }
  );

export default (ctx: { format: string }) => {
  const handler = handle(ctx);

  return (args: MediaMetadataArgs, callback: (result: unknown) => void) => {
    winston.info('getMediaMetadata', args);

    // Sonos occasionally asks without an id; we deliberately never answer.
    if (!args.id) return;

    return handler(args, callback);
  };
};
