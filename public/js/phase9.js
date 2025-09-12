/* Phase 9 — single storage key + auto-seed 12 + resilient posters */

const LS_KEY  = "xsf_vault_v1";   // single source of truth
const FAV_KEY = "xsf_favs_v1";

const $ = s => document.querySelector(s);

/* ------- storage helpers ------- */
function loadVault() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}
function saveVault(v)  { localStorage.setItem(LS_KEY, JSON.stringify(v)); }
function loadFavs()    { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); }
function saveFavs(s)   { localStorage.setItem(FAV_KEY, JSON.stringify([...s])); }

/* ------- fallback poster ------- */
function fallbackDataURL(title) {
  const t = encodeURIComponent(title || "No Poster");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#111'/><stop offset='1' stop-color='#222'/>
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='50%' text-anchor='middle' fill='#e3e3e3'
          font-family='Segoe UI, Roboto, sans-serif' font-size='42'>${t}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + svg;
}
function posterImg(src, title) {
  const img = document.createElement("img");
  img.alt = title || "Poster";
  img.loading = "lazy";
  img.decoding = "async";
  img.src = src || fallbackDataURL(title);
  img.onerror = () => { img.onerror = null; img.src = fallbackDataURL(title); };
  return img;
}

/* ------- ensure exactly 12 exist ------- */
function ensureSeed12() {
  let list = loadVault();
  if (Array.isArray(list) && list.length >= 12) return;

  const now = Date.now();
  list = [
    {id:"braveheart-1995",title:"Braveheart",poster:"https://image.tmdb.org/t/p/w500/or1gBugydmjToAEq7OZY0owwFk.jpg",addedAt:now-12*864e5},
    {id:"inception-2010",title:"Inception",poster:"https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",addedAt:now-11*864e5},
    {id:"matrix-1999",title:"The Matrix",poster:"https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",addedAt:now-10*864e5},
    {id:"interstellar-2014",title:"Interstellar",poster:"https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",addedAt:now-9*864e5},
    {id:"dark-knight-2008",title:"The Dark Knight",poster:"https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",addedAt:now-8*864e5},
    {id:"gladiator-2000",title:"Gladiator",poster:"https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",addedAt:now-7*864e5},
    {id:"mad-max-fury-road-2015",title:"Mad Max: Fury Road",poster:"https://image.tmdb.org/t/p/w500/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",addedAt:now-6*864e5},
    {id:"blade-runner-2049-2017",title:"Blade Runner 2049",poster:"https://image.tmdb.org/t/p/w500/aMpyrCizvSdc0UIMblJ1srVgAEF.jpg",addedAt:now-5*864e5},
    {id:"godfather-1972",title:"The Godfather",poster:"https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",addedAt:now-4*864e5},
    {id:"pulp-fiction-1994",title:"Pulp Fiction",poster:"https://image.tmdb.org/t/p/w500/dM2w364MScsjFf8pfMbA0UeWRrR.jpg",addedAt:now-3*864e5},
    {id:"shawshank-1994",title:"The Shawshank Redemption",poster:"https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",addedAt:now-2*864e5},
    {id:"lotr-fotr-2001",title:"The Lord of the Rings: The Fellowship of the Ring",poster:"https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",addedAt:now-1*864e5}
  ];
  saveVault(list);
  if (!localStorage.getItem(FAV_KEY)) saveFavs(new Set());
}

/* ------- render ------- */
function render(list = loadVault()) {
  const grid = document.getElementById("grid");
  const empty = document.getElementById("emptyState");
  grid.innerHTML = "";
  const favs = loadFavs();

  list.forEach(item => {
    const card = document.createElement("article");
    card.className = "bg-neutral-900 rounded-2xl overflow-hidden shadow-lg";

    const poster = document.createElement("div");
    poster.style.height = "300px";
    poster.style.background = "#0a0a0a";
    poster.appendChild(posterImg(item.poster, item.title));

    const footer = document.createElement("div");
    footer.className = "px-4 py-3 flex items-center justify-between";
    const title = document.createElement("div");
    title.className = "text-neutral-100";
    title.textContent = item.title;

    const actions = document.createElement("div");
    actions.className = "flex gap-2";
    const favBtn = document.createElement("button");
    favBtn.className = "px-2 py-1 rounded bg-neutral-800";
    favBtn.textContent = favs.has(item.id) ? "♥" : "♡";
    favBtn.onclick = () => {
      const s = loadFavs();
      if (s.has(item.id)) s.delete(item.id); else s.add(item.id);
      saveFavs(s); render(list);
    };
    const delBtn = document.createElement("button");
    delBtn.className = "px-2 py-1 rounded bg-neutral-800";
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      const v = loadVault().filter(x => x.id !== item.id);
      saveVault(v); render(v);
    };
    actions.append(favBtn, delBtn);

    footer.append(title, actions);
    card.append(poster, footer);
    grid.appendChild(card);
  });

  empty.classList.toggle("hidden", list.length > 0);
}

/* ------- filters ------- */
function applyFilters() {
  let list = loadVault();
  const q = (document.getElementById("search")?.value || "").trim().toLowerCase();
  if (q) list = list.filter(m => m.title.toLowerCase().includes(q));
  render(list);
}

/* ------- init ------- */
function init() {
  ensureSeed12();      // guarantees 12 exist in LS_KEY
  render();
  document.getElementById("search")?.addEventListener("input", applyFilters);
  document.getElementById("tabAll")?.addEventListener("click", applyFilters);
  document.getElementById("tabFav")?.addEventListener("click", () => {
    const favs = loadFavs();
    render(loadVault().filter(m => favs.has(m.id)));
  });
}
document.addEventListener("DOMContentLoaded", init);
