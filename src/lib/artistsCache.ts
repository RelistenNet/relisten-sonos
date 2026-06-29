import { API_V2_ROOT } from './relistenApi.js';

const artistsCache: { [key: string]: { slug: string; name: string } } = {};

fetch(`${API_V2_ROOT}/artists`)
  .then((res) => res.json())
  .then((json) =>
    json.map((artist: { slug: string; name: string }) => (artistsCache[artist.slug] = artist))
  );

export default artistsCache;
