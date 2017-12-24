const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

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

module.exports = (type) => (args, callback) => {
  const { id, term } = args;

  console.log('search', type, id, args);

  const searchForArtists = /artist/.test(id);
  // const searchForSongs = /song/.test(id);

  fetch(`${API_ROOT}/search?q=${term}`)
    .then(res => res.json())
    .then(json => {
      let results = [];

      searchForArtists && json.artists.map(artist => {
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
        })
      });

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
          mediaCollection: results
        }
      });
    });
};
