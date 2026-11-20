import { parseId } from '../ids.js';
import { getV4Artist, getV4Source, getV4Track } from '../relisten/api.js';
import { audioUrlForTrack, proxyStreamUrl } from '../relisten/tracks.js';
import type { V4Track } from '../relisten/types.js';
import { trackMetadata } from './presenters.js';
import { SmapiFault } from './respond.js';

const resolveUuidTrack = async <T>(id: string, resolve: (track: V4Track) => Promise<T>) => {
  const parsed = parseId(id);
  if (parsed?.kind !== 'uuidTrack') {
    throw new SmapiFault('Client.ItemNotFound', 'Invalid track ID.');
  }
  try {
    const track = await getV4Track(parsed.trackId);
    if (!track) throw new SmapiFault('Client.ItemNotFound', 'Track does not exist.');
    return await resolve(track);
  } catch (error) {
    if (error instanceof SmapiFault) throw error;
    throw new SmapiFault('Server.ServiceUnavailable', 'Relisten catalog is unavailable.', {
      cause: error,
    });
  }
};

export const uuidTrackStream = (id: string, format: string) =>
  resolveUuidTrack(id, async (track) => {
    const url = audioUrlForTrack(track, format);
    if (!url) throw new SmapiFault('Client.ItemNotFound', 'Track has no audio in this format.');

    const artist = await getV4Artist(track.artist_id);
    // V4 URLs may already be escaped. Parsing preserves existing percent escapes.
    return new URL(proxyStreamUrl(url, artist.slug)).href;
  });

export const uuidTrackMetadata = (id: string, format: string) =>
  resolveUuidTrack(id, async (track) => {
    const [artist, source] = await Promise.all([
      getV4Artist(track.artist_id),
      getV4Source(track.source_id),
    ]);
    return trackMetadata({
      id,
      slug: artist.slug,
      artistName: artist.name,
      album: [source.display_date, source.imported_venue?.name].filter(Boolean).join(' '),
      track,
      format,
      canPlay: audioUrlForTrack(track, format) !== undefined,
    });
  });
