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
      const items = results.Songs.flatMap((song) => {
        const artist = song.slim_artist;
        if (!artist?.slug) return [];

        return [
          {
            id: formatId({ kind: 'song', slug: artist.slug, songSlug: song.slug }),
            itemType: 'container',
            title: `${song.name} — ${artist.name}`,
            summary: `Played ${song.shows_played_at} time${song.shows_played_at === 1 ? '' : 's'}`,
            canEnumerate: true,
            canPlay: false,
          },
        ];
      });
      return { searchResult: paginate(items, args) };
    }

    if (/concert/.test(id ?? '')) {
      // Search matches sources (tapes), so one show can come back several times.
      // Collapse them into one entry per artist + date.
      const shows = new Map<
        string,
        { slug: string; artistName: string; date: string; venue?: string; tapes: number }
      >();

      for (const source of results.Sources) {
        const slug = source.slim_artist?.slug;
        const date = source.display_date;
        if (!slug || !date) continue;

        const key = `${slug}:${date}`;
        const existing = shows.get(key);
        if (existing) {
          existing.tapes += 1;
        } else {
          shows.set(key, {
            slug,
            artistName: source.slim_artist?.name ?? '',
            date,
            venue: [source.venue?.name, source.venue?.location].filter((x) => x).join(', '),
            tapes: 1,
          });
        }
      }

      const items = [...shows.values()].map((show) => ({
        id: formatId({
          kind: 'show',
          slug: show.slug,
          year: show.date.split('-')[0],
          date: show.date,
        }),
        itemType: 'container',
        title: [show.artistName, show.date, show.venue].filter((x) => x).join(' — '),
        summary: `${show.tapes} matching tape${show.tapes === 1 ? '' : 's'}`,
        canEnumerate: true,
        canPlay: true,
      }));
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
