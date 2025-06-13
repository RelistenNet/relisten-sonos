import winston from '../logger';
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
        trackUrl = trackUrl.replace('://archive.org/', '://audio.relisten.net/archive.org/');
      }

      // wat.
      // for some reason https doesn't work with cloudflare or phish.in and sonos.
      // meh
      if (slug === 'phish') {
        // trackUrl = trackUrl
        //   .replace('https', 'http')
        //   .replace('phish.in/audio', 'phishin-proxy.relisten.net/phishin-audio');
      }

      // sonos requires a urlencode, but we can't encode the slashes
      // encodeURI encodes a fully formed URL and won't encode the slashes
      // also use relisten proxy
      if (slug === 'wsp') {
        // this is important, auto encodes url
        const url = new URL(
          trackUrl.replace('www.panicstream.com/streams', 'phishin-proxy.relisten.net/panicstream')
        );
        trackUrl = url.href;

        headers.push({
          httpHeader: {
            header: 'Referer',
            value: 'https://www.panicstream.com',
          },
        });
      }

      winston.info('MP3 prepped', {
        getMediaURIResult: trackUrl, // 'http://192.168.0.101:3001/foo.mp3', //trackUrl,
        httpHeaders: headers,
      });

      callback({
        getMediaURIResult: trackUrl, // 'http://192.168.0.101:3001/foo.mp3', //trackUrl,
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
