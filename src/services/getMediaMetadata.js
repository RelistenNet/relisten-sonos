const db = require('../db');

getMediaMetadata = (id, callback) => {
  const [regex, trackId] = id.match(/Track\:(.*)/);

  db.query(`
    SELECT *, t.id as TrackId, t.title as TrackTitle
    FROM   Tracks t
    JOIN   Shows s ON s.id = t.ShowId
    WHERE t.id = ?
    LIMIT 1
  `, [trackId], (err, results) => {
    const track = results[0];

    callback({
      name: 'root',
      getMediaMetadataResult: {
        id: id,
        itemType: 'track',
        title: track.TrackTitle,
        genre: '',
        mimeType: 'audio/mp3',
        trackMetadata: {
          albumId: 'foo',
          duration: track.length,
          artistId: 'Artist:phish',
          artist: 'Phish',
          album: 'phish',
          albumArtURI: '',
          canPlay: true,
          canSkip: true,
          canAddToFavorites: false
        }
      }
    });
  });
}

module.exports = (args, callback) => {
  const id = args.id;

  console.log("getMediaMetadata", id);
  return getMediaMetadata(id, callback);
};
