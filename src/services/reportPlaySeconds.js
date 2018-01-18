const winston = require('../logger');

const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

const reportPlaySeconds = (type, id, callback) => {
  const [regex, slug, year, date, sourceId, trackId] = id.match(/Track\:(.*)\:(.*)\:(.*)\:(.*)\:(.*)/);

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.sources) {
        winston.error('no SONG json tracks found', slug, year, date, sourceId);
        return callback({ reportPlaySecondsResult: '' });
      }

      const source = json.sources.find(source => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', slug, year, date, sourceId);
        return callback({ reportPlaySecondsResult: '' });
      }

      let track;

      source.sets.map(set => {
        const nextTrack = set.tracks.find(internalTrack => `${internalTrack.id}` === trackId)

        if (nextTrack) track = nextTrack;
      });

      if (!track) return callback({ reportPlaySecondsResult: '' });

      console.log()
      callback({
        name: 'root',
        reportPlaySecondsResult: ''
      });
    })
    .catch(err => {
      winston.error(err);
      callback({});
    });
}

module.exports = (type) => (args, callback) => {
  const { id, status, offsetMillis, seconds } = args;

  winston.info("reportPlaySeconds", type, id, status, offsetMillis, seconds, args);
  return reportPlaySeconds(type, id, callback);
};
