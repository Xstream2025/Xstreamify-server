// routes/app.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/app.controller');

// health check (already working)
router.get('/status', (req, res) => {
  res.json({ ok: true, app: 'Xstreamify', version: '0.1.0', time: new Date().toISOString() });
});

router.get('/info', (req, res) => {
  res.json({ name: 'Xstreamify', version: '0.1.0' });
});

// NEW: /api/ping
router.get('/ping', controller.ping);

module.exports = router;
