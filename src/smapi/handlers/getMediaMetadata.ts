import { formatId, parseId } from '../../ids.js';
import type { SonosId } from '../../ids.js';
import winston from '../../logger.js';
import { getV4Artist, getV4Source, getV4Track } from '../../relisten/api.js';
import { getArtistName } from '../../relisten/artists.js';
import { findLegacyTrack, streamUrlForTrack } from '../../relisten/tracks.js';
import { trackMetadata } from '../presenters.js';
import { smapiHandler } from '../respond.js';
import type { SmapiCallback } from '../types.js';

type MediaMetadataArgs = { id?: string };

export const loadUuidTrackMetadata = async (
  parsed: Extract<SonosId, { kind: 'uuidTrack' }>,
  format: string
) => {
  const track = await getV4Track(parsed.trackId);
  if (!track) return undefined;

  const [artist, source] = await Promise.all([
    getV4Artist(track.artist_id),
    getV4Source(track.source_id),
  ]);

  return trackMetadata({
    id: formatId(parsed),
    slug: artist.slug,
    artistName: artist.name,
    album: [source.display_date, source.imported_venue?.name].filter(Boolean).join(' '),
    track,
    format,
    canPlay: streamUrlForTrack(track, format, artist.slug) !== undefined,
  });
};

// The exported wrapper below refuses to answer without an id, so the handler
// itself always sees one.
const handle = (ctx: { format: string }) =>
  smapiHandler<MediaMetadataArgs & { id: string }>(
    'getMediaMetadata',
    async ({ id }) => {
      const parsed = parseId(id);

      if (parsed?.kind === 'uuidTrack') {
        return { getMediaMetadataResult: (await loadUuidTrackMetadata(parsed, ctx.format)) ?? {} };
      }

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
