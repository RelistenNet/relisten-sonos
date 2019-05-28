const winston = require('../logger');
const artistsCache = require('../lib/artistsCache');

const API_ROOT = 'https://relistenapi.alecgorge.com/api/v2';

const getMediaMetadata = (type, id, callback) => {
  const [regex, slug, year, date, sourceId, trackId] = id.match(/Track\:(.*)\:(.*)\:(.*)\:(.*)\:(.*)/);

  const artist = artistsCache[slug];
  const artistName = artist ? artist.name : '';

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
        const nextTrack = set.tracks.find(internalTrack => `${internalTrack.id}` === trackId);

        if (nextTrack) track = nextTrack;
      });

      if (!track) return callback({ getMediaMetadataResult: {} });
      callback({
        getMediaMetadataResult: {
          id: id,
          itemType: 'track',
          title: track.title,
          genre: '',
          mimeType: type === 'flac' && track.flac_url ? 'audio/flac' : 'audio/mp3',
          trackMetadata: {
            albumId: `Show:${slug}:${year}:${date}:${sourceId}`,
            duration: track.duration,
            artistId: `Artist:${slug}`,
            artist: artistName,
            album: [
              `${json.display_date}`,
              json.venue ? json.venue.name : '',
            ].filter(x => x).join(' '),
            // albumArtURI: '',
            canPlay: true,
            canSkip: true,
            canAddToFavorites: false
          }
        }
      });
    })
    .catch(err => {
      winston.error(err);
      callback({});
    });
};

module.exports = (type) => (args, callback) => {
  const id = args.id;
  if (!id) return;

  winston.info('getMediaMetadata', id);
  winston.I.increment('sonos.wsdl.getMediaMetadata');
  return getMediaMetadata(type, id, callback);
};
