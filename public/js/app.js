// public/js/app.js

const $ = (sel) => document.querySelector(sel);
const out = $('#output');

function show(obj) {
  out.textContent = JSON.stringify(obj, null, 2);
}

async function hit(path) {
  try {
    const res = await fetch(path);
    const data = await res.json();
    show(data);
  } catch (err) {
    show({ ok: false, error: String(err) });
  }
}

$('#btnStatus').addEventListener('click', () => hit('/api/status'));
$('#btnPing').addEventListener('click', () => hit('/api/ping'));
$('#btnMovies').addEventListener('click', () => hit('/api/movies'));
$('#btnMovieById').addEventListener('click', () => {
  const id = $('#movieId').value.trim();
  if (!id) return show({ ok: false, error: 'Please enter an ID' });
  hit(`/api/movies/${encodeURIComponent(id)}`);
});
