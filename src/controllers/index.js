const express = require('express');
const fs = require('pn/fs');
const svg2png = require('svg2png');

const router = express.Router();

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
      console.log(e)
      return res.json({ error: true, e })
    });
});

module.exports = router;