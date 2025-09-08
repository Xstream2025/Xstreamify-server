// routes/movies.routes.js
const express = require('express');
const router = express.Router();

// Optional controller. If it's missing, we fall back to simple handlers
let ctrl = {};
try { ctrl = require('../controllers/movies'); } catch (_) {}

// GET /api/movies
router.get('/', ctrl.list || ((_req, res) => {
  res.json([{ id: 1, title: 'Demo Movie', format: 'DVD', notes: 'Sample item' }]);
}));

// POST /api/movies
router.post('/', ctrl.create || ((req, res) => {
  res.status(201).json({ ok: true, created: req.body || {} });
}));

// GET /api/movies/:id
router.get('/:id', ctrl.get || ((req, res) => {
  res.json({ id: req.params.id, title: 'Demo Movie' });
}));

// PUT /api/movies/:id
router.put('/:id', ctrl.update || ((req, res) => {
  res.json({ ok: true, id: req.params.id, updated: req.body || {} });
}));

// DELETE /api/movies/:id
router.delete('/:id', ctrl.remove || ((req, res) => {
  res.json({ ok: true, id: req.params.id, deleted: true });
}));

module.exports = router;
