import winston from '../../logger.js';
import { searchArtists } from '../../relisten/api.js';
import { searchArtistToItem } from '../presenters.js';
import { smapiHandler } from '../respond.js';

type SearchArgs = { id?: string; term?: string };

// const categories = [
//   {
//     mediaCollection: {
//       id: 'search-artists',
//       itemType: 'search',
//       title: 'artists',
//       canPlay: false,
//     }
//   }
// ];

export default (ctx: { format: string }) =>
  smapiHandler<SearchArgs>('search', async (args) => {
    const { id, term } = args;

    winston.info('search', { type: ctx.format, id, args });

    const searchForArtists = /artist/.test(id);
    // const searchForSongs = /song/.test(id);

    const artists = await searchArtists(term);

    const results = searchForArtists ? artists.map(searchArtistToItem) : [];

    // searchForSongs && json.songs.map(...)

    return {
      searchResult: {
        index: 0,
        count: results.length,
        total: results.length,
        mediaCollection: results,
      },
    };
  });
