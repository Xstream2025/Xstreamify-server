require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({ ok: true, app: 'Xstreamify', version: '0.1.0', time: new Date().toISOString() });
});

app.get('/api/info', (req, res) => {
  res.json({ name: 'Xstreamify', version: '0.1.0' });
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');

app.use(cors());          // allow requests (we’ll lock this down later)
app.use(morgan('dev'));   // request logs
