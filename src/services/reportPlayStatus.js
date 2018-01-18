const winston = require('../logger');

const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

const reportPlayStatus = (type, id, seconds, status, callback) => {
  const [regex, slug, year, date, sourceId, trackId] = id.match(/Track\:(.*)\:(.*)\:(.*)\:(.*)\:(.*)/);

  if (seconds > 25 || status === 'skippedTrack') {
    return callback({ reportPlayStatusResult: '' });
  }

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.sources) {
        winston.error('no SONG json tracks found', slug, year, date, sourceId);
        return callback({ reportPlayStatusResult: '' });
      }

      const source = json.sources.find(source => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', slug, year, date, sourceId);
        return callback({ reportPlayStatusResult: '' });
      }

      let track;

      source.sets.map(set => {
        const nextTrack = set.tracks.find(internalTrack => `${internalTrack.id}` === trackId)

        if (nextTrack) track = nextTrack;
      });

      if (!track) return callback({ reportPlayStatusResult: '' });

      // submit play POST
      fetch(`${API_ROOT}/live/play?track_id=${track.id}`, {
        method: 'POST',
      }).then(() => null);

      callback({
        name: 'root',
        reportPlayStatusResult: ''
      });
    })
    .catch(err => {
      winston.error(err);
      callback({});
    });
}

module.exports = (type) => (args, callback) => {
  const { id, seconds, status } = args;

  winston.info("reportPlayStatus", type, id, status, seconds, args);
  return reportPlayStatus(type, id, seconds, status, callback);
};
