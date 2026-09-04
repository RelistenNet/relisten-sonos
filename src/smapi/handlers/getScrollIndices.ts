import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { getArtistVenues, getArtistSongs } from '../../relisten/api.js';
import { refreshArtists } from '../../relisten/artists.js';
import { artistWrapper } from '../presenters.js';
import { smapiHandler } from '../respond.js';

type ScrollArgs = { id?: string };

const buildScrollIndices = (names: string[]): string => {
  const pairs: string[] = [];
  let lastLetter = '';

  for (let i = 0; i < names.length; i++) {
    const first = (names[i][0] ?? '').toUpperCase();
    if (first !== lastLetter && /[A-Z]/.test(first)) {
      pairs.push(first, String(i));
      lastLetter = first;
    }
  }

  return pairs.join(',');
};

export default smapiHandler<ScrollArgs>('getScrollIndices', async (args) => {
  const parsed = parseId(args.id);
  winston.info('getScrollIndices', { id: args.id });

  if (!parsed) return {};

  let indices = '';

  switch (parsed.kind) {
    case 'root': {
      const artists = await refreshArtists();
      // +1 offset for "Latest Tapes" at position 0
      const names = artists.map((a) => artistWrapper(a.name));
      const pairs: string[] = [];
      let lastLetter = '';
      for (let i = 0; i < names.length; i++) {
        const first = (names[i][0] ?? '').toUpperCase();
        if (first !== lastLetter && /[A-Z]/.test(first)) {
          pairs.push(first, String(i + 1));
          lastLetter = first;
        }
      }
      indices = pairs.join(',');
      break;
    }

    case 'venues': {
      const venues = await getArtistVenues(parsed.slug);
      const sorted = [...venues].sort((a, b) => (b.shows_at_venue ?? 0) - (a.shows_at_venue ?? 0));
      indices = buildScrollIndices(sorted.map((v) => v.name));
      break;
    }

    case 'songs': {
      const songs = await getArtistSongs(parsed.slug);
      const sorted = [...songs].sort((a, b) => b.shows_played_at - a.shows_played_at);
      indices = buildScrollIndices(sorted.map((s) => s.name));
      break;
    }
  }

  if (!indices) return {};

  return { getScrollIndicesResult: indices };
});
