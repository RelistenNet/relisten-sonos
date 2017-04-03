const db = require('../db');

const getRoot = (callback) => {
  db.query(`
    SELECT * FROM artists
    ORDER BY name
  `, (err, results) => {

    const artists = results.map(artist => {
      return {
        id: `Artist:${artist.slug}`,
        itemType: 'artist',
        displayType: 'artist',
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

getArtistYears = (id, callback) => {
  const slug = id.replace('ArtistYears:', '');

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
        itemType: 'year',
        displayType: 'year',
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

getArtistShowsForYear = (id, callback) => {
  const [regex, slug, year] = id.match(/ArtistShows\:(.*)\:(.*)/);

  db.query(`
    SELECT *
    FROM   Shows s
    JOIN   Artists a ON a.id = s.ArtistId
    WHERE a.slug = ?
    AND   s.year = ?
    GROUP BY display_date
    ORDER BY date
  `, [slug, year], (err, results) => {

    const shows = results.map(artist => {
      return {
        id: `Show:${artist.slug}:${artist.display_date}`,
        itemType: 'show',
        displayType: 'show',
        title: artist.display_date,
        summary: artist.display_date,
        canPlay: false,
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

module.exports = (args, callback) => {
  const id = args.id;

  if (id === 'root') {
    getRoot(callback);
  }
  else if (/ArtistYears\:/.test(id)) {
    getArtistYears(id, callback);
  }
  else if (/ArtistShows\:/.test(id)) {
    getArtistShowsForYear(id, callback);
  }
  else if (/ArtistShow\:/.test(id)) {
    getArtistYears(id, callback);
  }
};
