// routes/app.routes.js
const express = require('express');
const router = express.Router();

// Health endpoints
router.get('/status', (_req, res) => {
  res.json({ ok: true, app: 'Xstreamify', version: '0.1.0', time: new Date().toISOString() });
});

router.get('/ping', (_req, res) => {
  res.json({ ok: true, message: 'pong', at: new Date().toISOString() });
});

// (Optional) quick error test during dev
// Hit /api/error to see the centralized error handler in action
router.get('/error', (_req, _res) => {
  throw new Error('Dev test error');
});

module.exports = router;
