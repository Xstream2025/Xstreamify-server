const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Xstreamify API is live 🚀'));
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
