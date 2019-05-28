const winston = require('../logger');
const artistsCache = require('../lib/artistsCache');
const { durationToHHMMSS } = require('../lib/utils');

const API_ROOT = 'https://api.relisten.net/api/v2';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SONOS_ROOT = IS_PRODUCTION ? 'https://sonos.relisten.net' : 'http://192.168.0.101:3000';

const getRoot = (callback) => {
  fetch(`${API_ROOT}/artists`)
    .then(res => res.json())
    .then(json => {
      const artists = json.map(artist => {
        artistsCache[artist.slug] = artist;
        return {
          id: `Artist:${artist.slug}`,
          itemType: 'artist',
          displayType: 'list-sans-thumbs',
          title: artist.name,
          summary: artist.name,
          canPlay: false,
          // albumArtURI: ''
        };
      }).filter(x => x);

      callback({
        getMetadataResult: {
          index: 0,
          count: artists.length,
          total: artists.length,
          mediaCollection: artists,
        },
      });
    })
    .catch(err => {
      winston.error(err);
      return callback({});
    });
};

const getYears = (id, callback) => {
  const slug = id.replace('Artist:', '');

  fetch(`${API_ROOT}/artists/${slug}/years`)
    .then(res => res.json())
    .then(json => {
      const years = json.map(item => {
        return {
          id: `Year:${slug}:${item.year}`,
          itemType: 'container',
          displayType: 'list-sans-thumbs',
          title: item.year,
          summary: item.year,
          canPlay: false,
          // albumArtURI: ''
        };
      });

      callback({
        getMetadataResult: {
          index: 0,
          count: years.length,
          total: years.length,
          mediaCollection: years,
        },
      });
    })
    .catch(err => {
      winston.error(err);
      return callback({});
    });
};

const getShows = (id, callback) => {
  const [regex, slug, year] = id.match(/Year:(.*):(.*)/);

  fetch(`${API_ROOT}/artists/${slug}/years/${year}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.shows) {
        winston.error('error', { regex });
        return callback({});
      }

      const shows = json.shows.map(show => {
        return {
          id: `Shows:${slug}:${year}:${show.display_date}`,
          itemType: 'container',
          displayType: 'list',
          title: [
            show.display_date,
            show.venue && show.venue.name,
            show.venue && show.venue.location,
          ].filter(x => x)
            .join(' - ')
           + ' ' +
           [
             `[${show.source_count}]`,
             show.has_soundboard_source && '[SBD]',
           ].filter(x => x).join(' '),
          summary: show.display_date,
          // canPlay: show.source_count === 1,
          albumArtURI: `${SONOS_ROOT}/album-art/${slug}/years/${year}/${show.display_date}/600.png`,
        };
      });

      callback({
        getMetadataResult: {
          index: 0,
          count: shows.length,
          total: shows.length,
          mediaCollection: shows,
        },
      });
    })
    .catch(err => {
      winston.error(err);
      return callback({});
    });
};

const getShow = (type, id, callback) => {
  const [regex, slug, year, date] = id.match(/Shows:(.*):(.*):(.*)/);

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.sources) {
        winston.error('error', { regex });
        return callback({});
      }

      // if (json.sources.length === 1) return getTracks(type, `Show:${slug}:${year}:${date}:${json.sources[0].id}`, callback);

      const sources = json.sources.filter(source => type === 'flac' ? source.flac_type !== 'Flac24Bit' : true).map(source => {
        return {
          id: `Show:${slug}:${year}:${date}:${source.id}`,
          itemType: 'album',
          displayType: 'list',
          title: [
            source.source || source.lineage || source.taper || source.display_date,
            source.is_soundboard ? '[SBD]' : '[AUD]',
            type === 'flac' && source.flac_type === 'Flac16Bit' && json.has_streamable_flac_source && '[FLAC]',
          ].filter(x => x).join(' '),
          summary: source.description || '',
          canPlay: true,
          albumArtURI: `${SONOS_ROOT}/album-art/${slug}/years/${year}/${date}/${json.sources[0].id}/600.png`,
        };
      });

      callback({
        getMetadataResult: {
          index: 0,
          count: sources.length,
          total: sources.length,
          mediaCollection: sources,
        },
      });
    })
    .catch(err => {
      winston.error(err);
      return callback({});
    });
};

const getTracks = (type, id, callback) => {
  const [, slug, year, date, sourceId] = id.match(/Show:(.*):(.*):(.*):(.*)/);

  const artist = artistsCache[slug];
  const artistName = artist ? artist.name : '';

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.sources) {
        winston.error('no json tracks found', { slug, year, date, sourceId });
        return callback({});
      }

      const source = json.sources.find(source => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no source found', { slug, year, date, sourceId });
        return callback({});
      }

      let tracks = [];
      let trackIdx = 0;

      source.sets.map(set => {
        tracks = tracks.concat(
          set.tracks.map(track => {
            const [year, month, day] = date.split('-');

            return {
              id: `Track:${slug}:${year}:${date}:${source.id}:${track.id}`,
              itemType: 'track',
              mimeType: type === 'flac' && track.flac_url ? 'audio/flac' : 'audio/mp3',
              title: `${track.title} [${durationToHHMMSS(track.duration)}]`,
              trackMetadata: {
                albumId: id,
                duration: track.duration,
                artistId: `Artist:${slug}`,
                artist: artistName,
                albumArtURI: `${SONOS_ROOT}/album-art/${slug}/years/${year}/${date}/${sourceId}/600.png`,
                trackNumber: ++trackIdx,
                album: [
                  `${Number(month)}/${Number(day)}/${year.slice(2)}`,
                  json.venue ? json.venue.name : '',
                  json.venue ? json.venue.location : '',
                ].filter(x => x).join(' - '),
              },
            };
          })
        );
      });

      callback({
        getMetadataResult: {
          index: 0,
          count: tracks.length,
          total: tracks.length,
          mediaMetadata: tracks,
        },
      });
    })
    .catch(err => {
      winston.error(err);
      return callback({});
    });
};

module.exports = (type) => (args, callback) => {
  const id = args.id;

  winston.info('getMetadata', { id, args });

  if (id === 'root') {
    winston.I.increment('sonos.wsdl.getMetadata.root');
    return getRoot(callback);
  }
  else if (/Artist:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Artist');
    return getYears(id, callback);
  }
  else if (/Year:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Year');
    return getShows(id, callback);
  }
  else if (/Shows:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Shows');
    return getShow(type, id, callback);
  }
  else if (/Show:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Show');
    return getTracks(type, id, callback);
  }
};
