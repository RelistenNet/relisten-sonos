import winston from '../logger';
import artistsCache from '../lib/artistsCache';

const API_ROOT = 'https://api.relisten.net/api/v2';

const getMediaMetadata = (type, id, callback) => {
  const [, slug, year, date, sourceId, trackId] = id.match(/Track:(.*):(.*):(.*):(.*):(.*)/);

  const artist = artistsCache[slug];
  const artistName = artist ? artist.name : '';

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
            album: [`${json.display_date}`, json.venue ? json.venue.name : '']
              .filter((x) => x)
              .join(' '),
            // albumArtURI: '',
            canPlay: true,
            canSkip: true,
            canAddToFavorites: false,
          },
        },
      });
    })
    .catch((err) => {
      winston.error(err);
      callback({});
    });
};

exports.API_ROOT = API_ROOT;

export default (type) => (args, callback) => {
  winston.info('getMediaMetadata', args);

  const id = args.id;
  if (!id) return;

  winston.I.increment('sonos.wsdl.getMediaMetadata');
  return getMediaMetadata(type, id, callback);
};
