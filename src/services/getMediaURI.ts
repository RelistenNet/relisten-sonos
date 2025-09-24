import winston from '../logger.js';
const API_ROOT = 'https://api.relisten.net/api/v2';

const getMediaURI = (type, id, callback) => {
  const [, slug, year, date, sourceId, trackId] = id.match(/Track:(.*):(.*):(.*):(.*):(.*)/);

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then((res) => res.json())
    .then((json) => {
      if (!json || !json.sources) {
        winston.error('no SONG json tracks found', { slug, year, date, sourceId });
        return callback({ getMediaURIResult: '' });
      }

      const source = json.sources.find((source) => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no SONG source found', { slug, year, date, sourceId });
        return callback({ getMediaURIResult: '' });
      }

      let track;

      source.sets.map((set) => {
        const nextTrack = set.tracks.find((internalTrack) => `${internalTrack.id}` === trackId);

        if (nextTrack) track = nextTrack;
      });
      if (!track) return callback({ getMediaURIResult: '' });

      let trackUrl = track[`${type}_url`] || track.mp3_url;

      const headers = [];

      if (/\/archive\.org/.test(trackUrl)) {
        trackUrl = trackUrl.replace('://archive.org/', '://audio-bare.relisten.net/archive.org/');
      }

      if (slug === 'phish') {
        trackUrl = trackUrl.replace('://phish.in', '://audio-bare.relisten.net/phish.in');
      }

      if (slug === 'trey') {
        trackUrl = trackUrl.replace('://audio.relisten.net', '://audio-bare.relisten.net');
      }

      winston.info('MP3 prepped', {
        getMediaURIResult: encodeURI(trackUrl), // 'http://192.168.0.101:3001/foo.mp3', //trackUrl,
        httpHeaders: headers,
      });

      callback({
        getMediaURIResult: encodeURI(trackUrl), // 'http://192.168.0.101:3001/foo.mp3', //trackUrl,
        httpHeaders: headers,
      });
    })
    .catch((err) => {
      winston.error(err);
      callback({});
    });
};

export default (type) => (args, callback) => {
  const id = args.id;

  winston.info('getMediaURI', { type, id });
  winston.I.increment('sonos.wsdl.getMediaURI');
  return getMediaURI(type, id, callback);
};
