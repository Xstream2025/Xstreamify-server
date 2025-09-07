// routes/movies.routes.js
const express = require('express');
const router = express.Router();

// IMPORTANT: one level up to the controllers folder, then the file.
const ctrl = require('../controllers/movies.controller');

router.get('/movies', ctrl.list);
router.get('/movies/:id', ctrl.get);

module.exports = router;
