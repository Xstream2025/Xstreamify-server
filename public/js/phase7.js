/* Phase 7 — merged with Phase 6 behaviors (favorites + filters + search) */

/* ----- Data ----- */
const movies = [
  { title: "Spirited Away", year: 2001, poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
  { title: "Interstellar", year: 2014, poster: "https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg" },
  { title: "The Dark Knight", year: 2008, poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { title: "Arrival", year: 2016, poster: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg" },
  { title: "Whiplash", year: 2014, poster: "" },
  { title: "Blade Runner 2049", year: 2017, poster: "" }
];

const PLACEHOLDER = "/img/placeholder-2x3.png";

/* ----- DOM ----- */
const grid = document.getElementById("grid");
const btnAll = document.getElementById("filter-all");
const btnRecent = document.getElementById("filter-recent");
const btnFavs = document.getElementById("filter-favs");
const searchInput = document.getElementById("search");

/* ----- Storage helpers (Phase 6 style) ----- */
const FAV_KEY = "xstreamify:favs";
const favSet = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));
function saveFavs() { localStorage.setItem(FAV_KEY, JSON.stringify([...favSet])); }

/* ----- Render ----- */
function render(list) {
  grid.innerHTML = "";
  list.forEach(movie => {
    const id = `${movie.title}-${movie.year}`;

    const tile = document.createElement("article");
    tile.className = "tile-card";
    tile.dataset.year = movie.year;
    tile.dataset.id = id;

    const poster = (movie.poster && movie.poster.trim() ? movie.poster : PLACEHOLDER);

    const heartBtn = document.createElement("button");
    heartBtn.className = "heart-btn" + (favSet.has(id) ? " is-liked" : "");
    heartBtn.innerHTML = `
      <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
          C13.09 3.81 14.76 3 16.5 3
          19.58 3 22 5.42 22 8.5
          c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;

    heartBtn.addEventListener("click", () => {
      if (favSet.has(id)) { favSet.delete(id); heartBtn.classList.remove("is-liked"); }
      else { favSet.add(id); heartBtn.classList.add("is-liked"); }
      saveFavs();
    });

    tile.innerHTML = `
      <img class="poster"
           src="${poster}"
           alt="${movie.title}"
           onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
      <div class="tile-title">${movie.title} <span>${movie.year}</span></div>
    `;

    tile.appendChild(heartBtn);
    grid.appendChild(tile);
  });
}

/* ----- Filters (Phase 6 behaviors) ----- */
function setActive(btn) {
  [btnAll, btnRecent, btnFavs].forEach(b => b.classList.remove("pill--active"));
  btn.classList.add("pill--active");
}

function applyFilters() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  let list = movies.filter(m => m.title.toLowerCase().includes(q));

  if (btnRecent.classList.contains("pill--active")) {
    // "Recently Added" = newest first (last 3 by year)
    list = [...list].sort((a,b) => b.year - a.year).slice(0, 3);
  }
  if (btnFavs.classList.contains("pill--active")) {
    list = list.filter(m => favSet.has(`${m.title}-${m.year}`));
  }
  render(list);
}

/* Events */
btnAll?.addEventListener("click", () => { setActive(btnAll); applyFilters(); });
btnRecent?.addEventListener("click", () => { setActive(btnRecent); applyFilters(); });
btnFavs?.addEventListener("click", () => { setActive(btnFavs); applyFilters(); });
searchInput?.addEventListener("input", () => applyFilters());

/* Initial load */
setActive(btnAll);
applyFilters();
