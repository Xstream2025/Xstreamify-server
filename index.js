app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    app: process.env.APP_NAME || 'Xstreamify',
    version: '0.1.0',
    time: new Date().toISOString(),
  });
});
