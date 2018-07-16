const winston = require('../logger');

const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

const getMediaURI = (type, id, callback) => {
  const [regex, slug, year, date, sourceId, trackId] = id.match(/Track\:(.*)\:(.*)\:(.*)\:(.*)\:(.*)/);

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.sources) {
        winston.error('no SONG json tracks found', slug, year, date, sourceId);
        return callback({ getMediaURIResult: '' });
      }

      const source = json.sources.find(source => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', slug, year, date, sourceId);
        return callback({ getMediaURIResult: '' });
      }

      let track;

      source.sets.map(set => {
        const nextTrack = set.tracks.find(internalTrack => `${internalTrack.id}` === trackId)

        if (nextTrack) track = nextTrack;
      });

      if (!track) return callback({ getMediaURIResult: '' });

      let trackUrl = track[`${type}_url`] || track.mp3_url;

      const options = {
        method: 'HEAD'
      };

      fetch(trackUrl, options)
        .then(res => {
          if (res.url) {
            trackUrl = res.url;
          }

          // wat.
          // for some reason https doesn't work with cloudflare or phish.in and sonos.
          // meh
          if (slug === 'phish') {
            trackUrl = trackUrl.replace('https', 'http');
          }

          callback({
            getMediaURIResult: trackUrl
          });
        })
    })
    .catch(err => {
      winston.error(err);
      callback({});
    });
}

module.exports = (type) => (args, callback) => {
  const id = args.id;

  winston.info("getMediaURI", type, id);
  winston.I.increment("sonos.wsdl.getMediaURI");
  return getMediaURI(type, id, callback);
};
