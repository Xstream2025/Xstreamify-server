// js/app.js
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// routes
const moviesRouter = require('../routes/movies.routes');
app.use('/api/movies', moviesRouter);

// fallback route: serve index.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// start server
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});

module.exports = app;
