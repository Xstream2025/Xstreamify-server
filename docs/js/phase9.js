/* Phase 9 — dataset + render + tabs + favorite toggle + localStorage */
console.log("Phase 9 JS loaded");

// --- tiny helpers ---
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const STORAGE_KEY = "xsf_movies_v1";

// --- seed data (used only if nothing in localStorage yet) ---
const seed = [
  {
    id: "braveheart",
    title: "Braveheart",
    poster: "/img/placeholder-2x3.png",
    addedAt: "2024-12-01T10:00:00Z",
    fav: true,
  },
  {
    id: "madmax-fury",
    title: "Mad Max: Fury Road",
    poster: "/img/placeholder-2x3.png",
    addedAt: "2025-01-15T18:00:00Z",
    fav: false,
  },
  {
    id: "matrix",
    title: "The Matrix",
    poster: "/img/placeholder-2x3.png",
    addedAt: "2025-02-20T12:00:00Z",
    fav: true,
  },
  {
    id: "blade-runner",
    title: "Blade Runner",
    poster: "/img/placeholder-2x3.png",
    addedAt: "2025-03-05T09:30:00Z",
    fav: false,
  },
];

// --- state ---
let movies = loadMovies();
let currentTab = "all";

// --- init ---
highlightActiveTab();
render();

// wire up tabs
$$(".tab-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    currentTab = btn.dataset.tab; // "all" | "recent" | "favs"
    highlightActiveTab();
    render();
  })
);

// --- functions ---
function loadMovies() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return [...seed];
    }
    return JSON.parse(raw);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return [...seed];
  }
}

function saveMovies() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
}

function filteredMovies() {
  if (currentTab === "favs") {
    return movies.filter((m) => m.fav);
  }
  if (currentTab === "recent") {
    return [...movies].sort(
      (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
    );
  }
  return [...movies];
}

function render() {
  const list = filteredMovies();
  const grid = $("#grid");
  const empty = $("#empty");

  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = list
    .map(
      (m) => `
      <article class="group relative">
        <div class="aspect-[2/3] w-full overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/5">
          <img src="${m.poster}" alt="${m.title}" class="w-full h-full object-cover group-hover:scale-[1.02] transition" />
          <button aria-label="Toggle favorite"
            data-id="${m.id}"
            class="fav absolute top-2 right-2 p-2 rounded-full bg-black/60 backdrop-blur ring-1 ring-white/20">
            ${heartSVG(m.fav)}
          </button>
        </div>
        <h3 class="mt-2 text-sm text-white/90">${m.title}</h3>
      </article>
    `
    )
    .join("");

  // hook heart buttons
  $$(".fav").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const id = btn.getAttribute("data-id");
      toggleFav(id);
      // re-render current view to reflect changes immediately
      render();
    })
  );
}

function toggleFav(id) {
  const idx = movies.findIndex((m) => m.id === id);
  if (idx >= 0) {
    movies[idx].fav = !movies[idx].fav;
    saveMovies();
  }
}

function highlightActiveTab() {
  $$(".tab-btn").forEach((b) => {
    const active = b.dataset.tab === currentTab;
    b.className =
      "tab-btn px-4 py-2 rounded-full ring-1 " +
      (active
        ? "bg-rose-600 text-white ring-rose-500"
        : "ring-white/15 text-white/80 hover:text-white");
  });
}

function heartSVG(on) {
  return on
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" class="text-rose-500"><path d="M12 21s-6.716-4.374-9.193-8.064C.763 9.84 2.11 6.5 5.163 5.6 7.08 5.03 8.99 5.78 10 7.09c1.01-1.31 2.92-2.06 4.837-1.49 3.053.9 4.4 4.24 2.356 7.336C18.716 16.626 12 21 12 21z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" class="text-white/80"><path d="M12 21s-6.716-4.374-9.193-8.064C.763 9.84 2.11 6.5 5.163 5.6 7.08 5.03 8.99 5.78 10 7.09c1.01-1.31 2.92-2.06 4.837-1.49 3.053.9 4.4 4.24 2.356 7.336C18.716 16.626 12 21 12 21z"/></svg>`;
}
