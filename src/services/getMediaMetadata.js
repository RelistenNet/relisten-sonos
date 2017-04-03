const db = require('../db');

getMediaMetadata = (id, callback) => {
  const [regex, trackId] = id.match(/Track\:(.*)/);

  db.query(`
    SELECT *, t.id as TrackId, t.title as TrackTitle, s.title as ShowTitle, a.name as ArtistName, s.id as ShowId
    FROM   Tracks t
    JOIN   Shows s ON s.id = t.ShowId
    JOIN   Artists a ON a.id = s.ArtistId
    WHERE s.id = ?
  `, [trackId], (err, results) => {
    if (err) console.log(err);

    const track = results[0];

    if (!track) return callback({ getMediaMetadataResult: {} });

    callback({
      name: 'root',
      getMediaMetadataResult: {
        id: id,
        itemType: 'track',
        title: track.TrackTitle,
        genre: '',
        mimeType: 'audio/mp3',
        trackMetadata: {
          albumId: track.ShowId,
          duration: track.length,
          artistId: `Artist:${track.slug}`,
          artist: track.ArtistName,
          album: track.ShowTitle,
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
