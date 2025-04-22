import I from 'instrumental-agent';

const API_ROOT = 'https://api.relisten.net/api/v2';

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

export default (type) => (args, callback) => {
  const { id, term } = args;

  console.log('search', type, id, args);
  I.increment('sonos.wsdl.search');

  const searchForArtists = /artist/.test(id);
  // const searchForSongs = /song/.test(id);

  fetch(`${API_ROOT}/search?q=${term}`)
    .then((res) => res.json())
    .then((json) => {
      const results = [];

      if (searchForArtists) {
        json.artists.map((artist) => {
          results.push({
            id: `Artist:${artist.slug}`,
            itemType: 'artist',
            // displayType: 'list',
            title: artist.name,
            summary: artist.name,
            canEnumerate: true,
            authrequired: 0,
            canPlay: false,
            // albumArtURI: ''
          });
        });
      }

      // searchForSongs && json.songs.map(artist => {
      //   results.push({
      //     id: `Artist:${artist.slug}`,
      //     itemType: 'artist',
      //     // displayType: 'list',
      //     title: artist.name,
      //     summary: artist.name,
      //     canEnumerate: true,
      //     canPlay: false,
      //     albumArtURI: ''
      //   })
      // });

      return callback({
        searchResult: {
          index: 0,
          count: results.length,
          total: results.length,
          mediaCollection: results,
        },
      });
    });
};
