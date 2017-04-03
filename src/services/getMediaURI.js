const db = require('../db');

getMediaURI = (id, callback) => {
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
      getMediaURIResult: track.file
    });
  });
}

module.exports = (args, callback) => {
  const id = args.id;

  console.log("getMediaURI", id);
  return getMediaURI(id, callback);
};
