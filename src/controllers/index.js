const winston = require('../logger');
const express = require('express');

const fs = require('fs');
const svg2png = require('svg2png');

const router = express.Router();

const artistsCache = require('../lib/artistsCache');
const { createCanvas, registerFont } = require('canvas');
const { drawRelistenAlbumArt, makeRect } = require('../lib/albumArt');

// registerFont(__dirname + '/../../fonts/Roboto-Bold.ttf', { family: 'Roboto Bold' });
registerFont(__dirname + '/../../fonts/Roboto-Black.ttf', { family: 'RobotoBlack' });

router.get('/', (req, res) => {
  return res.json({ hi: 'hi world' });
});

router.get('/album-art', (req, res) => {
  fs.readFile(__dirname + '/../../images/relisten-album-background.svg')
    .then(svg2png)
    .then(buffer => {
      res.type('image/png');
      res.send(buffer);
    })
    .catch(e => {
      // just send a default placeholder image here I guess.
      console.log(e);
      return res.json({ error: true, e });
    });
});

router.get('/album-art/:artist/years/:year/:show_date/:source?/:size.png', (req, res) => {
  const size = parseInt(req.params['size'], 10);

  if (!(size > 0 && size <= 1500)) {
    res.send(400);
    return;
  }

  const canvas = createCanvas(size, size);

  const slug = req.params['artist'];

  const artist = artistsCache[slug];
  const artistName = artist ? artist.name : '';

  const year = req.params['year'];
  const date = req.params['show_date'];
  const sourceId = req.params['source'];

  fetch(`https://api.relisten.net/api/v2/artists/${slug}/years/${year}/${date}`)
    .then(res => res.json())
    .then(json => {
      if (!json || !json.sources) {
        winston.error('no json tracks found', slug, year, date, sourceId);
        return callback({});
      }

      const source = json.sources.find(source => `${source.id}` === sourceId) || json.sources[0];

      if (!source || !source.sets) {
        winston.error('no source found', slug, year, date, sourceId);
        return callback({});
      }

      let venue = {
        name: 'Unknown',
        location: 'Unknown'
      };

      if (json.venue) {
        venue = json.venue;
      }
      else if (source.venue) {
        venue = source.venue;
      }

      drawRelistenAlbumArt(canvas, {
        artist: artistName,
        showDate: json.display_date,
        venue: venue.name,
        location: venue.location
      }, makeRect(0, 0, size, size), 'aspectfill');

      res.type('png');

      // PNG Buffer, zlib compression level 3 (from 0-9): faster but bigger
      res.send(canvas.toBuffer(undefined, 3, canvas.PNG_FILTER_NONE));
    });
});

module.exports = router;
