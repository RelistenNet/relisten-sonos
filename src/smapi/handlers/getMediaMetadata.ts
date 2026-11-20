import { formatId, isUuidTrackRequest, parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getArtistName } from '../../relisten/artists.js';
import { findLegacyTrack } from '../../relisten/tracks.js';
import { trackMetadata } from '../presenters.js';
import { smapiHandler } from '../respond.js';
import type { SmapiCallback } from '../types.js';
import { uuidTrackMetadata } from '../uuidTrack.js';

type MediaMetadataArgs = { id?: string };

// The exported wrapper below refuses to answer without an id, so the handler
// itself always sees one.
const handle = (ctx: { format: string }) =>
  smapiHandler<MediaMetadataArgs & { id: string }>(
    'getMediaMetadata',
    async ({ id }) => {
      if (isUuidTrackRequest(id)) {
        return { getMediaMetadataResult: await uuidTrackMetadata(id, ctx.format) };
      }

      const parsed = parseId(id);
      if (parsed?.kind !== 'track') {
        winston.error('unparseable getMediaMetadata id', { id });
        return { getMediaMetadataResult: {} };
      }

      const { slug, year, date, sourceId } = parsed;
      const artistName = await getArtistName(slug);
      const found = await findLegacyTrack(parsed);
      if (!found) return { getMediaMetadataResult: {} };
      const { show, track } = found;

      return {
        getMediaMetadataResult: trackMetadata({
          id,
          slug,
          albumId: formatId({ kind: 'source', slug, year, date, sourceId }),
          album: [show.display_date, show.venue?.name].filter(Boolean).join(' '),
          artistName,
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
