
const artistsCache = {};

fetch('https://api/relisten.net/api/v2/artists')
  .then((res) => res.json())
  .then((json) => json.map((artist) => (artistsCache[artist.slug] = artist)));

module.exports = artistsCache;
