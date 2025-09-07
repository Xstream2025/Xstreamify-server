// controllers/movies.controller.js
const data = [
  { id: "101", title: "The Matrix", year: 1999 },
  { id: "102", title: "Inception", year: 2010 },
  { id: "123", title: "Interstellar", year: 2014 },
];

exports.list = (req, res) => {
  res.json({ ok: true, items: data });
};

exports.get = (req, res) => {
  const item = data.find(x => x.id === req.params.id);
  res.json({ ok: true, item: item ?? null });
};
