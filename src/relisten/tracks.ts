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

export const audioUrlForTrack = (
  track: Pick<Track, 'flac_url' | 'mp3_url'>,
  format: string
): string | undefined => (format === 'flac' && track.flac_url) || track.mp3_url || undefined;

// Sonos fetches the stream directly. Route these providers through our audio proxy.
export const proxyStreamUrl = (trackUrl: string, slug: string): string => {
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
