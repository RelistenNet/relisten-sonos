import { formatId } from '../../ids.js';
import winston from '../../logger.js';
import { search } from '../../relisten/api.js';
import { searchArtistToItem } from '../presenters.js';
import { paginate, smapiHandler } from '../respond.js';

type SearchArgs = { id?: string; term?: string; index?: number; count?: number };

export default (ctx: { format: string }) =>
  smapiHandler<SearchArgs>('search', async (args) => {
    const { id, term } = args;

    winston.info('search', { type: ctx.format, id, args });

    const results = await search(term);

    if (/artist/.test(id ?? '')) {
      const items = results.Artists.map(searchArtistToItem);
      return { searchResult: paginate(items, args) };
    }

    if (/song/.test(id ?? '')) {
      const items = results.Songs.map((song) => ({
        id: formatId({ kind: 'song', slug: song.slim_artist?.slug ?? '', songSlug: song.slug }),
        itemType: 'container',
        title: `${song.name}${song.slim_artist ? ` — ${song.slim_artist.name}` : ''}`,
        summary: `Played ${song.shows_played_at} time${song.shows_played_at === 1 ? '' : 's'}`,
        canEnumerate: true,
        canPlay: false,
      }));
      return { searchResult: paginate(items, args) };
    }

    if (/concert/.test(id ?? '')) {
      const items = results.Sources.map((source) => {
        const slug = source.slim_artist?.slug ?? '';
        const date = source.display_date ?? '';
        const [year] = date.split('-');
        return {
          id: formatId({ kind: 'show', slug, year, date }),
          itemType: 'container',
          title: [
            source.slim_artist?.name,
            date,
            source.venue?.name,
            source.venue?.location,
          ]
            .filter((x) => x)
            .join(' — '),
          summary: source.description ?? '',
          canEnumerate: true,
          canPlay: true,
        };
      });
      return { searchResult: paginate(items, args) };
    }

    return {
      searchResult: {
        index: 0,
        count: 0,
        total: 0,
        mediaCollection: [],
      },
    };
  });
