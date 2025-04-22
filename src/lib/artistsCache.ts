const artistsCache: { [key: string]: { slug: string; name: string } } = {};

fetch('https://api.relisten.net/api/v2/artists')
  .then((res) => res.json())
  .then((json) =>
    json.map((artist: { slug: string; name: string }) => (artistsCache[artist.slug] = artist))
  );

export default artistsCache;
