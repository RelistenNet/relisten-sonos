const { API_ROOT } = require("../services/getMediaMetadata");

const artistsCache = {};

fetch(API_ROOT + '/artists')
  .then((res) => res.json())
  .then((json) => json.map((artist) => (artistsCache[artist.slug] = artist)));

module.exports = artistsCache;
