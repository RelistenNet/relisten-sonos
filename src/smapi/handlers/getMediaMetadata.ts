import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getArtistName } from '../../relisten/artists.js';
import { lookupTrack } from '../../relisten/tracks.js';
import { trackMetadata } from '../presenters.js';
import { smapiHandler } from '../respond.js';
import type { SmapiCallback } from '../types.js';

type MediaMetadataArgs = { id?: string };

// The exported wrapper below refuses to answer without an id, so the handler
// itself always sees one.
const handle = (ctx: { format: string }) =>
  smapiHandler<MediaMetadataArgs & { id: string }>(
    'getMediaMetadata',
    async ({ id }) => {
      const parsed = parseId(id);

      if (!parsed || parsed.kind !== 'track') {
        winston.error('unparseable getMediaMetadata id', { id });
        return { getMediaMetadataResult: {} };
      }

      const { slug, year, date, sourceId, trackId } = parsed;

      const artistName = await getArtistName(slug);
      const found = await lookupTrack(slug, year, date, sourceId, trackId);

      if (!found) return { getMediaMetadataResult: {} };

      const { show, track } = found;
      // May differ from the id's source when the track was found elsewhere.
      const liveSourceId = `${found.source.id}`;

      return {
        getMediaMetadataResult: trackMetadata({
          id,
          slug,
          year,
          date,
          sourceId: liveSourceId,
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

  return (args: MediaMetadataArgs, callback?: SmapiCallback) => {
    winston.info('getMediaMetadata', args);

    const { id } = args;

    // Sonos occasionally asks without an id; we deliberately never answer.
    if (!id) return;

    return handler({ ...args, id }, callback);
  };
};
