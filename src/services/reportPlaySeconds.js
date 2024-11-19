const winston = require('../logger');
const { API_ROOT } = require('./getMediaMetadata');

const reportPlaySeconds = (type, id, seconds, callback) => {
  const [, slug, year, date, sourceId, trackId] = id.match(/Track:(.*):(.*):(.*):(.*):(.*)/);

  // only report initial play
  if (seconds > 25) {
    return callback({ reportPlaySecondsResult: '' });
  }

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then((res) => res.json())
    .then((json) => {
      if (!json || !json.sources) {
        winston.error('no SONG json tracks found', { slug, year, date, sourceId });
        return callback({ reportPlaySecondsResult: '' });
      }

      const source = json.sources.find((source) => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', { slug, year, date, sourceId });
        return callback({ reportPlaySecondsResult: '' });
      }

      let track;

      source.sets.map((set) => {
        const nextTrack = set.tracks.find((internalTrack) => `${internalTrack.id}` === trackId);

        if (nextTrack) track = nextTrack;
      });

      if (!track) return callback({ reportPlaySecondsResult: '' });

      // submit play POST
      fetch(`${API_ROOT}/live/play?track_id=${track.id}&app_type=sonos`, {
        method: 'POST',
      }).then(() => null);

      callback({
        reportPlaySecondsResult: '',
      });
    })
    .catch((err) => {
      winston.error(err);
      callback({});
    });
};

module.exports = (type) => (args, callback) => {
  const { id, seconds } = args;

  // winston.info('reportPlaySeconds', { type, id, seconds, args });
  winston.I.increment('sonos.wsdl.reportPlaySeconds');
  return reportPlaySeconds(type, id, seconds, callback);
};
