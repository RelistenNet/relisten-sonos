const db = require('../db');
const winston = require('../logger');
require('isomorphic-fetch');

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

    if (!track) return callback({ getMediaURIResult: '' });

    let trackUrl = track.file;

    const options = {
      method: 'HEAD'
    };

    fetch(trackUrl, options)
      .then(res => {
        if (res.url) {
          trackUrl = res.url;
        }

        callback({
          name: 'root',
          getMediaURIResult: trackUrl
        });
      })

  });
}

module.exports = (args, callback) => {
  const id = args.id;

  winston.info("getMediaURI", id);
  return getMediaURI(id, callback);
};
