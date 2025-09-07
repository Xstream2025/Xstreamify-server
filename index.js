const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// middleware & static
app.use(cors());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// routes
const appRoutes   = require('./routes/app.routes');
const movieRoutes = require('./routes/movies.routes');

app.use('/api', appRoutes);
app.use('/api', movieRoutes);

// start
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
