import { parseId } from '../../ids.js';
import winston from '../../logger.js';
import { refreshArtists } from '../../relisten/artists.js';
import { artistWrapper } from '../presenters.js';
import { smapiHandler } from '../respond.js';

type ScrollArgs = { id?: string };

export default smapiHandler<ScrollArgs>('getScrollIndices', async (args) => {
  const parsed = parseId(args.id);
  winston.info('getScrollIndices', { id: args.id });

  if (!parsed) return {};

  if (parsed.kind === 'root') {
    const artists = await refreshArtists();
    const pairs: string[] = [];
    let lastLetter = '';
    artists.forEach((artist, i) => {
      // Featured artists sit ahead of the alphabetical list, and a few
      // lowercase names sort after Z; Sonos needs letters in ascending order.
      if (artist.featured) return;
      const first = (artistWrapper(artist.name)[0] ?? '').toUpperCase();
      if (/[A-Z]/.test(first) && first > lastLetter) {
        // +1 offset for "Latest Tapes" at position 0
        pairs.push(first, String(i + 1));
        lastLetter = first;
      }
    });
    return { getScrollIndicesResult: pairs.join(',') };
  }

  return {};
});
