// public/js/xsf-search.js
// Non-destructive search + pills layered on top of Phase 6.
// It DOES NOT modify your hearts code. It only hides/shows cards.

(function () {
  // ===== Helpers =====
  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  // Try common containers/grids from your Phase 6
  const grids = [
    "#library-grid",
    "#moviesGrid",
    "#grid",
    "[data-grid='library']"
  ];
  const grid = grids.map(g => document.querySelector(g)).find(Boolean);

  // If we can't find a grid, bail safely
  if (!grid) {
    console.warn("[xsf-search] No grid found. Add id='library-grid' to your tiles container.");
    return;
  }

  // Find or create a search bar and three pills
  let controlsHost = document.getElementById("xsf-controls");
  if (!controlsHost) {
    controlsHost = document.createElement("div");
    controlsHost.id = "xsf-controls";
    controlsHost.className = "max-w-7xl mx-auto px-4 mt-4 mb-2 flex flex-wrap gap-2 items-center";
    // Insert just before the grid
    grid.parentElement.insertBefore(controlsHost, grid);
  }

  controlsHost.innerHTML = `
    <input id="xsf-search" type="text" placeholder="Search your library..."
           class="flex-1 min-w-[220px] bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
    <div class="flex gap-2">
      <button id="xsf-pill-all" class="px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">All</button>
      <button id="xsf-pill-recent" class="px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Recently Added</button>
      <button id="xsf-pill-favs" class="px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Favorites</button>
    </div>
  `;

  // Figure out each card and how to read its title + date + id
  function getCards() {
    // Common card selectors from Phase 6
    const cards = $all(".card, .movie-card, [data-card='movie']", grid);
    return cards.length ? cards : $all("div, article, a", grid).filter(el => el.querySelector("img"));
  }

  function readTitle(card) {
    // Try common title selectors or fallback to innerText
    const t = card.querySelector(".title, .movie-title, [data-title]");
    return (t?.textContent || card.getAttribute("data-title") || card.textContent || "")
      .trim()
      .toLowerCase();
  }

  function readAddedAt(card) {
    // yyyy-mm-dd preferred if present
    const v = card.getAttribute("data-added-at") || card.dataset?.addedAt || "";
    const d = v ? new Date(v) : null;
    return d && !isNaN(d) ? d : null;
  }

  function isFav(card) {
    // Phase 6 used localStorage key xsf_favs_v1 with ids
    const id = card.getAttribute("data-id") || card.dataset?.id;
    if (!id) return false;
    try {
      const favs = new Set(JSON.parse(localStorage.getItem("xsf_favs_v1") || "[]"));
      return favs.has(id);
    } catch {
      return false;
    }
  }

  // Render utils
  function show(card, yes) {
    card.style.display = yes ? "" : "none";
  }

  // Current state
  let state = { query: "", filter: "all" }; // all | recent | favs

  function apply() {
    const cards = getCards();
    if (!cards.length) return;

    // Prepare for "recent": sort by data-added-at if available (non-destructive — visual only)
    if (state.filter === "recent") {
      const sorted = [...cards].sort((a, b) => {
        const da = readAddedAt(a) || new Date(0);
        const db = readAddedAt(b) || new Date(0);
        return db - da;
      });
      sorted.forEach(el => grid.appendChild(el));
    }

    const q = state.query.toLowerCase();

    cards.forEach(card => {
      const title = readTitle(card);
      const matchQuery = !q || title.includes(q);
      const passFav = state.filter !== "favs" || isFav(card);
      const passAllOrRecent = state.filter !== "favs"; // recent handled by sort only
      show(card, matchQuery && (passFav || passAllOrRecent));
    });
  }

  // Wire inputs
  $("#xsf-search").addEventListener("input", (e) => {
    state.query = e.target.value || "";
    apply();
  });

  $("#xsf-pill-all").addEventListener("click", () => { state.filter = "all"; apply(); });
  $("#xsf-pill-recent").addEventListener("click", () => { state.filter = "recent"; apply(); });
  $("#xsf-pill-favs").addEventListener("click", () => { state.filter = "favs"; apply(); });

  // Initial run
  apply();

  // Re-apply when hearts change (Phase 6 toggles localStorage; listen to storage)
  window.addEventListener("storage", (e) => {
    if (e.key === "xsf_favs_v1") apply();
  });
})();
