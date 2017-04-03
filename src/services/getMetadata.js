const db = require('../db');

const getRoot = (callback) => {
  db.query(`
    SELECT * FROM artists
    ORDER BY name
  `, (err, results) => {

    const artists = results.map(artist => {
      return {
        id: `Artist:${artist.slug}`,
        itemType: 'other',
        displayType: 'list',
        title: artist.name,
        summary: artist.name,
        canPlay: false,
        albumArtURI: ''
      };
    });

    callback({
      name: 'root',
      getMetadataResult: {
        index: 0,
        count: artists.length,
        total: artists.length,
        mediaCollection: artists
      }
    });
  });
}

const getYears = (id, callback) => {
  const slug = id.replace('Artist:', '');

  db.query(`
    SELECT *
    FROM   Years y
    JOIN   Artists a ON a.id = y.ArtistId
    WHERE a.slug = ?
    ORDER BY year DESC
  `, [slug], (err, results) => {

    const years = results.map(artist => {
      return {
        id: `Year:${artist.slug}:${artist.year}`,
        itemType: 'other',
        displayType: 'list',
        title: artist.year,
        summary: artist.year,
        canPlay: false,
        albumArtURI: ''
      };
    });

    callback({
      name: 'root',
      getMetadataResult: {
        index: 0,
        count: years.length,
        total: years.length,
        mediaCollection: years
      }
    });
  });
}

getShows = (id, callback) => {
  const [regex, slug, year] = id.match(/Year\:(.*)\:(.*)/);

  db.query(`
    SELECT *, a.slug as ArtistSlug, v.name as VenueName, v.city as VenueCity, count(display_date) as count
    FROM   Shows s
    JOIN   Artists a ON a.id = s.ArtistId
    JOIN   Venues v ON v.id = s.VenueId
    WHERE a.slug = ?
    AND   s.year = ?
    GROUP BY display_date
    ORDER BY date
  `, [slug, year], (err, results = []) => {
    if (err) {
      console.log(err);
      return callback({})
    }

    const shows = results.map(artist => {
      return {
        id: `Shows:${artist.ArtistSlug}:${artist.display_date}`,
        itemType: 'show',
        displayType: 'list',
        title: `${artist.display_date} ${artist.VenueName} ${artist.VenueCity}`,
        summary: artist.display_date,
        canPlay: artist.count === 1,
        albumArtURI: ''
      };
    });

    callback({
      name: 'root',
      getMetadataResult: {
        index: 0,
        count: shows.length,
        total: shows.length,
        mediaCollection: shows
      }
    });
  });
}

const getShow = (id, callback) => {
  const [regex, slug, date] = id.match(/Shows\:(.*)\:(.*)/);

  db.query(`
    SELECT *, s.id as ShowId
    FROM   Shows s
    JOIN   Artists a ON a.id = s.ArtistId
    WHERE s.display_date = ?
    AND a.slug = ?
  `, [date, slug], (err, results) => {

    if (results.length === 1) return getTracks(`Show:${results[0].ShowId}`, callback);

    const shows = results.map(show => {
      return {
        id: `Show:${show.ShowId}`,
        itemType: 'show',
        displayType: 'list',
        title: show.lineage || show.taper || show.display_date,
        summary: show.title,
        canPlay: true,
        albumArtURI: ''
      };
    });

    callback({
      name: 'root',
      getMetadataResult: {
        index: 0,
        count: shows.length,
        total: shows.length,
        mediaCollection: shows
      }
    });
  });
}

const getTracks = (id, callback) => {
  const [regex, showId] = id.match(/Show\:(.*)/);

  db.query(`
    SELECT *, t.id as TrackId, t.title as TrackTitle, s.title as ShowTitle, a.name as ArtistName
    FROM   Tracks t
    JOIN   Shows s ON s.id = t.ShowId
    JOIN   Artists a ON a.id = s.ArtistId
    WHERE s.id = ?
  `, [showId], (err, results) => {

    const tracks = results.map(track => {
      return {
        id: `Track:${track.TrackId}`,
        itemType: 'track',
        mimeType: 'audio/mp3',
        title: track.TrackTitle,
        trackMetadata: {
          albumId: id,
          duration: track.length,
          artistId: `Artist:${track.slug}`,
          artist: track.ArtistName,
          album: track.ShowTitle,
          albumArtURI: ''
        }
      };
    });

    callback({
      name: 'root',
      getMetadataResult: {
        index: 0,
        count: tracks.length,
        total: tracks.length,
        mediaMetadata: tracks
      }
    });
  });
}

module.exports = (args, callback) => {
  const id = args.id;

  console.log("getMetadata", id);

  if (id === 'root') {
    return getRoot(callback);
  }
  else if (/Artist\:/.test(id)) {
    return getYears(id, callback);
  }
  else if (/Year\:/.test(id)) {
    return getShows(id, callback);
  }
  else if (/Shows\:/.test(id)) {
    return getShow(id, callback);
  }
  else if (/Show\:/.test(id)) {
    return getTracks(id, callback);
  }
};
