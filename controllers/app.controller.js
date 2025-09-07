// controllers/app.controller.js
exports.ping = (req, res) => {
  res.json({ ok: true, message: 'pong', at: new Date().toISOString() });
};
