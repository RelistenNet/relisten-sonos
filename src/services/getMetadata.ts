import winston from '../logger.js';
import artistsCache from '../lib/artistsCache.js';
import { durationToHHMMSS, sortTapes } from '../lib/utils.js';

const API_ROOT = 'https://api.relisten.net/api/v2';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ALBUM_ART_CDN = IS_PRODUCTION ? 'https://sonos-cdn.relisten.net' : 'http://192.168.0.19:3000';

const artistWrapper = (name: string) => {
  if (name === 'Phish') return 'Phish (by Phish.in)';

  return name;
};

const LATEST_TAPES = 'Latest Tapes';

const getRoot = (args, callback) => {
  const { count, index } = args;

  fetch(`${API_ROOT}/artists`)
    .then((res) => res.json())
    .then((json) => {
      const artists = json
        .map((artist) => {
          artistsCache[artist.slug] = artist;
          return {
            id: `Artist:${artist.slug}`,
            itemType: 'artist',
            displayType: 'list-sans-thumbs',
            title: artistWrapper(artist.name),
            summary: artist.name,
            canPlay: false,
            // albumArtURI: ''
          };
        })
        .filter((x) => x);

      const allResults = [
        {
          id: 'latest',
          itemType: 'container',
          displayType: 'list-sans-thumbs',
          title: LATEST_TAPES,
          summary: 'Latest recordings',
          canPlay: false,
          // albumArtURI: ''
        },
        ...artists,
      ];

      const results = allResults.slice(index, index + count);

      winston.info(
        `getRoot allResults.length=${allResults.length}, results.length=${results.length}`
      );

      callback({
        getMetadataResult: {
          index,
          total: allResults.length,
          count: results.length,
          mediaCollection: results,
        },
      });
    })
    .catch((err) => {
      console.error(err);
      winston.error('root err', { err });
      return callback({});
    });
};

const getLatest = (args, callback) => {
  const { count, index } = args;

  fetch(`${API_ROOT}/shows/recently-added`)
    .then((res) => res.json())
    .then((json) => {
      const allResults = json.map((item) => {
        return {
          id: `Shows:${item.artist.slug}:${item.year.year}:${item.display_date}`,
          itemType: 'container',
          displayType: 'list-sans-thumbs',
          title: [
            (item.has_soundboard_source ? '[SBD]' : '[AUD]') + ' ' + item.artist &&
              item.artist.name,
            item.display_date,
            item.venue && item.venue.name,
            item.venue && item.venue.location,
          ]
            .filter((x) => x)
            .join(' - '),
          summary: [
            (item.has_soundboard_source ? '[SBD]' : '[AUD]') + ' ' + item.artist &&
              item.artist.name,
            item.display_date,
            item.venue && item.venue.name,
            item.venue && item.venue.location,
          ]
            .filter((x) => x)
            .join(' '),
          canPlay: false,
          // albumArtURI: ''
        };
      });

      const results = allResults.slice(index, index + count);

      callback({
        getMetadataResult: {
          index,
          total: allResults.length,
          count: results.length,
          mediaCollection: results,
        },
      });
    })
    .catch((err) => {
      winston.error(err);
      return callback({});
    });
};

const getYears = (args, callback) => {
  const { id, count, index } = args;

  const slug = id.replace('Artist:', '');

  fetch(`${API_ROOT}/artists/${slug}/years`)
    .then((res) => res.json())
    .then((json) => {
      const years = json.map((item) => {
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

      const allResults = [
        {
          id: `Year:${slug}:latest`,
          itemType: 'container',
          displayType: 'list-sans-thumbs',
          title: LATEST_TAPES,
          summary: 'Most recent recordings',
          canPlay: false,
          // albumArtURI: ''
        },
        ...years,
      ];

      const results = allResults.slice(index, index + count);

      callback({
        getMetadataResult: {
          index,
          total: allResults.length,
          count: results.length,
          mediaCollection: results,
        },
      });
    })
    .catch((err) => {
      winston.error(err);
      return callback({});
    });
};

const getShows = (args, callback) => {
  const { id, count, index } = args;

  const [regex, slug, year] = id.match(/Year:(.*):(.*)/);

  let url = `${API_ROOT}/artists/${slug}/years/${year}`;

  if (year === 'latest') {
    url = `${API_ROOT}/artists/${slug}/shows/recently-added`;
  }

  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (!json) {
        winston.error('error', { regex });
        return callback({});
      }

      const arr = Array.isArray(json) ? json : json.shows;

      const allResults = arr.map((show) => {
        return {
          id: `Shows:${slug}:${year}:${show.display_date}`,
          itemType: 'container',
          displayType: 'list',
          title:
            [
              (show.has_soundboard_source ? '[SBD]' : '[AUD]') + ' ' + show.display_date,
              show.venue && show.venue.name,
              show.venue && show.venue.location,
            ]
              .filter((x) => x)
              .join(' - ') + ` [${show.source_count}]`,
          summary: show.display_date,
          canPlay: show.source_count === 1,
          albumArtURI: `${ALBUM_ART_CDN}/album-art/${slug}/years/${year}/${show.display_date}/600.png`,
        };
      });

      const results = allResults.slice(index, index + count);

      callback({
        getMetadataResult: {
          index,
          total: allResults.length,
          count: results.length,
          mediaCollection: results,
        },
      });
    })
    .catch((err) => {
      winston.error(err);
      return callback({});
    });
};

const getShow = (type, args, callback) => {
  const { id, count, index } = args;

  const [regex, slug, year, date] = id.match(/Shows:(.*):(.*):(.*)/);

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then((res) => res.json())
    .then((json) => {
      if (!json || !json.sources) {
        winston.error('error', { regex });
        return callback({});
      }

      // if (json.sources.length === 1) return getTracks(type, `Show:${slug}:${year}:${date}:${json.sources[0].id}`, callback);

      if (slug === 'wsp' || slug === 'phish' || slug === 'trey') {
        return getTracks(
          type,
          { id: `Show:${slug}:${year}:${date}:${json.sources[0].id}`, count: 500, index: 0 },
          callback
        );
      }

      const allResults = sortTapes(json.sources)
        .filter((source) => (type === 'flac' ? source.flac_type !== 'Flac24Bit' : true))
        .map((source) => {
          const person = source.taper || source.transferrer;
          const sourceTitle = source.source || source.lineage;

          return {
            id: `Show:${slug}:${year}:${date}:${source.id}`,
            itemType: 'album',
            displayType: 'list',
            title: [
              (source.is_soundboard ? '[SBD]' : '[AUD]') + ' ' + sourceTitle,
              person ? `by ${person}` : null,
              type === 'flac' &&
                source.flac_type === 'Flac16Bit' &&
                json.has_streamable_flac_source &&
                '[FLAC]',
            ]
              .filter((x) => x)
              .join(' '),
            summary: source.description || '',
            canPlay: true,
            albumArtURI: `${ALBUM_ART_CDN}/album-art/${slug}/years/${year}/${date}/${json.sources[0].id}/600.png`,
          };
        });

      const results = allResults.slice(index, index + count);

      callback({
        getMetadataResult: {
          index,
          total: allResults.length,
          count: results.length,
          mediaCollection: results,
        },
      });
    })
    .catch((err) => {
      winston.error(err);
      return callback({});
    });
};

const getTracks = (type: string, args, callback) => {
  const { id, count, index } = args;

  const [, slug, year, date, sourceId] = id.match(/Show:(.*):(.*):(.*):(.*)/);

  const artist = artistsCache[slug];
  const artistName = artist ? artist.name : '';

  fetch(`${API_ROOT}/artists/${slug}/years/${year}/${date}`)
    .then((res) => res.json())
    .then((json) => {
      if (!json || !json.sources) {
        winston.error('no json tracks found', { slug, year, date, sourceId });
        return callback({});
      }

      const source = json.sources.find((source) => `${source.id}` === sourceId);

      if (!source || !source.sets) {
        winston.error('no source found', { slug, year, date, sourceId });
        return callback({});
      }

      let tracks = [];
      let trackIdx = 0;

      source.sets.map((set) => {
        tracks = tracks.concat(
          set.tracks.map((track) => {
            const [year, month, day] = date.split('-');

            return {
              id: `Track:${slug}:${year}:${date}:${source.id}:${track.id}`,
              itemType: 'track',
              mimeType: type === 'flac' && track.flac_url ? 'audio/flac' : 'audio/mp3',
              title: `${track.title} [${durationToHHMMSS(track.duration)}]`,
              canPlay: true,
              trackMetadata: {
                albumId: id,
                duration: track.duration,
                artistId: `Artist:${slug}`,
                artist: artistName,
                albumArtURI: `${ALBUM_ART_CDN}/album-art/${slug}/years/${year}/${date}/${sourceId}/600.png`,
                trackNumber: ++trackIdx,
                album: [
                  `${Number(month)}/${Number(day)}/${year.slice(2)}`,
                  json.venue ? json.venue.name : '',
                  json.venue ? json.venue.location : '',
                ]
                  .filter((x) => x)
                  .join(' - '),
              },
            };
          })
        );
      });

      const results = tracks.slice(index, index + count);

      callback({
        getMetadataResult: {
          index,
          total: tracks.length,
          count: results.length,
          mediaMetadata: results,
        },
      });
    })
    .catch((err) => {
      winston.error(err);
      return callback({});
    });
};

export default (type: string) => (args, callback) => {
  const { id } = args;
  winston.info('getMetadata', { id, args });

  if (id === 'root') {
    winston.I.increment('sonos.wsdl.getMetadata.root');
    return getRoot(args, callback);
  } else if (id === 'latest') {
    winston.I.increment('sonos.wsdl.getMetadata.Latest');
    return getLatest(args, callback);
  } else if (/Artist:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Artist');
    return getYears(args, callback);
  } else if (/Year:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Year');
    return getShows(args, callback);
  } else if (/Shows:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Shows');
    return getShow(type, args, callback);
  } else if (/Show:/.test(id)) {
    winston.I.increment('sonos.wsdl.getMetadata.Show');
    return getTracks(type, args, callback);
  }
};
