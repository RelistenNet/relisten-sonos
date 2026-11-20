import type { SonosId } from '../ids.js';
import { getShow } from './api.js';
import type { Show, Source, Track } from './types.js';

export const findSource = (show: Show, sourceId: string): Source | undefined =>
  show.sources?.find((source) => `${source.id}` === sourceId);

export const findTrack = (source: Source, trackId: string): Track | undefined => {
  let track: Track | undefined;

  source.sets?.forEach((set) => {
    const nextTrack = set.tracks.find((internalTrack) => `${internalTrack.id}` === trackId);

    if (nextTrack) track = nextTrack;
  });

  return track;
};

export const findLegacyTrack = async ({
  slug,
  year,
  date,
  sourceId,
  trackId,
}: Extract<SonosId, { kind: 'track' }>) => {
  const show = await getShow(slug, year, date);
  const source = show && findSource(show, sourceId);
  const track = source && findTrack(source, trackId);
  return track ? { show, track } : undefined;
};

// Sonos streams straight from these hosts, so a few of them get pointed at our
// own bare-metal audio proxy.
export const streamUrlForTrack = (
  track: Pick<Track, 'flac_url' | 'mp3_url'>,
  format: string,
  slug: string
): string | undefined => {
  // flac is the only alternate format a track ever carries; everything else
  // (including plain mp3) falls back to the mp3 url.
  let trackUrl = (format === 'flac' ? track.flac_url : track.mp3_url) || track.mp3_url;

  if (!trackUrl) return undefined;

  if (/\/archive\.org/.test(trackUrl)) {
    trackUrl = trackUrl.replace('://archive.org/', '://audio-bare.relisten.net/archive.org/');
  }

  if (slug === 'phish') {
    trackUrl = trackUrl.replace('://phish.in', '://audio-bare.relisten.net/phish.in');
  }

  if (slug === 'trey') {
    trackUrl = trackUrl.replace('://audio.relisten.net', '://audio-bare.relisten.net');
  }

  return trackUrl;
};
