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
    return { getScrollIndicesResult: pairs.join(',') };
  }

  return {};
});
