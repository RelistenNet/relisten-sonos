import winston from '../logger.js';
import { getArtists } from './api.js';
import type { Artist } from './types.js';

const artistsBySlug: { [slug: string]: Artist } = {};

let inFlight: Promise<Artist[]> | null = null;

// Refetch the whole artist list and repopulate the cache. Concurrent callers
// share a single request.
export const refreshArtists = (): Promise<Artist[]> => {
  if (!inFlight) {
    inFlight = getArtists()
      .then((artists) => {
        artists.forEach((artist) => {
          artistsBySlug[artist.slug] = artist;
        });

        return artists;
      })
      .finally(() => {
        inFlight = null;
      });
  }

  return inFlight;
};

export const getArtist = async (slug: string): Promise<Artist | undefined> => {
  if (artistsBySlug[slug]) return artistsBySlug[slug];

  try {
    await refreshArtists();
  } catch (err) {
    winston.error('failed to refresh artists', { err });
  }

  return artistsBySlug[slug];
};

export const getArtistName = async (slug: string): Promise<string> => {
  const artist = await getArtist(slug);

  return artist ? artist.name : '';
};
