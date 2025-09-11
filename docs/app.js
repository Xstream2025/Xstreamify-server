// ---------- Data (sample) ----------
const sampleMovies = [
  { id: "m1", title: "The Great Escape", year: 1963, featured: true, addedAt: "2025-08-30", poster: "" },
  { id: "m2", title: "Interstellar", year: 2014, featured: true, addedAt: "2025-09-05", poster: "" },
  { id: "m3", title: "The Matrix", year: 1999, featured: true, addedAt: "2025-09-01", poster: "" },
  { id: "m4", title: "Arrival", year: 2016, featured: false, addedAt: "2025-09-07", poster: "" },
  { id: "m5", title: "Whiplash", year: 2014, featured: false, addedAt: "2025-08-15", poster: "" },
  { id: "m6", title: "Blade Runner 2049", year: 2017, featured: false, addedAt: "2025-09-02", poster: "" }
];

// Load library from localStorage or seed with sample
const LIBRARY_KEY = "xsf_library_v1";
let library = [];
try {
  const raw = localStorage.getItem(LIBRARY_KEY);
  library = raw ? JSON.parse(raw) : sampleMovies;
  if (!raw) localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
} catch {
  library = sampleMovies;
}

// Favorites from Phase 6
const FAVS_KEY = "xsf_favs_v1";
const getFavs = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

// ---------- DOM ----------
const featuredRow = document.getElementById("featured-row");
const libraryGrid = document.getElementById("library-grid");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const pills = document.getElementById("cta-pills");

let state = {
  query: "",
  filter: "all" // all | recent | favs
};

// ---------- Renderers ----------
function posterBlock(titleInitial = "M") {
  // Simple placeholder art
  return `
    <div class="aspect-[2/3] w-full rounded-xl bg-gradient-to-br from-zinc-900 to-black
                border border-zinc-800 grid place-items-center text-5xl font-bold text-white/20">
      ${titleInitial}
    </div>`;
}

function movieCard(m) {
  const favs = getFavs();
  const isFav = favs.has(m.id);
  return `
    <div class="group rounded-xl overflow-hidden border border-zinc-800 hover:border-red-500/50 transition">
      <div class="relative">
        ${posterBlock(m.title.charAt(0))}
        <button data-id="${m.id}"
                class="absolute top-2 right-2 text-xl ${isFav ? "text-red-500" : "text-white/40"} fav-btn">
          ♥
        </button>
      </div>
      <div class="p-2 text-sm">
        <div class="font-semibold">${m.title}</div>
        <div class="text-white/50">${m.year}</div>
      </div>
    </div>`;
}

// ---------- Filtering ----------
function applyFilters() {
  let results = [...library];

  // Search
  if (state.query) {
    const q = state.query.toLowerCase();
    results = results.filter(m => m.title.toLowerCase().includes(q));
  }

  // Filter
  if (state.filter === "recent") {
    results = results.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  } else if (state.filter === "favs") {
    const favs = getFavs();
    results = results.filter(m => favs.has(m.id));
  }

  renderLibrary(results);
}

function renderFeatured() {
  const featured = library.filter(m => m.featured);
  featuredRow.innerHTML = featured.map(movieCard).join("");
}

function renderLibrary(list) {
  if (!list.length) {
    libraryGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");
  libraryGrid.innerHTML = list.map(movieCard).join("");
}

// ---------- Events ----------
searchInput.addEventListener("input", e => {
  state.query = e.target.value.trim();
  applyFilters();
});

pills.addEventListener("click", e => {
  if (e.target.tagName === "BUTTON") {
    state.filter = e.target.dataset.filter;
    applyFilters();
  }
});

libraryGrid.addEventListener("click", e => {
  if (e.target.classList.contains("fav-btn")) {
    const id = e.target.dataset.id;
    const favs = getFavs();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));
    applyFilters();
    renderFeatured();
  }
});

// ---------- Init ----------
renderFeatured();
applyFilters();
