const express = require('express');
const router = express.Router()

router.get('/', (req, res) => {
  return res.json({ hi: 'hi world' });
});

module.exports = router;