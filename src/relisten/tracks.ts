import winston from '../logger.js';
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

// Resolve a track id's parts down to the show, source and track they name.
export const lookupTrack = async (
  slug: string,
  year: string,
  date: string,
  sourceId: string,
  trackId: string
): Promise<{ show: Show; source: Source; track: Track } | undefined> => {
  const show = await getShow(slug, year, date);

  if (!show || !show.sources) {
    winston.error('no SONG json tracks found', { slug, year, date, sourceId });
    return undefined;
  }

  const source = findSource(show, sourceId);
  const track = source && findTrack(source, trackId);

  if (source && track) return { show, source, track };

  // Upstream re-imports can renumber a show's sources while keeping its track
  // ids, which strands old favorites and queues. Fall back to any source that
  // still carries the track.
  for (const candidate of show.sources) {
    const match = findTrack(candidate, trackId);
    if (match) {
      winston.info('track found under a different source', { slug, date, sourceId, trackId });
      return { show, source: candidate, track: match };
    }
  }

  winston.error('no SONG track found', { slug, year, date, sourceId, trackId });
  return undefined;
};

// Sonos streams straight from these hosts, so a few of them get pointed at our
// own bare-metal audio proxy.
export const streamUrlForTrack = (
  track: Track,
  format: string,
  slug: string
): string | undefined => {
  // flac is the only alternate format a track ever carries; everything else
  // (including plain mp3) falls back to the mp3 url.
  let trackUrl = (format === 'flac' ? track.flac_url : track.mp3_url) || track.mp3_url;

  if (trackUrl === undefined) return undefined;

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
