// public/js/search-overlay.js
// Safe search/pills overlay. Does NOT change hearts or baseline UI.

(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(() => {
    const grid = document.querySelector("#library-grid") || document.querySelector("#moviesGrid");
    if (!grid) {
      console.warn("[search-overlay] No grid found. Skipping.");
      return;
    }

    // --- Controls UI ---
    const controls = document.createElement("div");
    controls.className = "max-w-7xl mx-auto px-4 mt-4 mb-3 flex flex-wrap items-center gap-2";
    controls.innerHTML = `
      <input id="so-search" type="text" placeholder="Search your library..."
        class="flex-1 min-w-[220px] bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
      <div class="flex gap-2">
        <button data-filter="all"     class="so-pill px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">All</button>
        <button data-filter="recent"  class="so-pill px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Recently Added</button>
        <button data-filter="favs"    class="so-pill px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Favorites</button>
      </div>
    `;
    grid.parentElement.insertBefore(controls, grid);

    // --- Helpers ---
    const getCards = () => Array.from(grid.querySelectorAll("[data-id]"));
    const titleOf = c => (c.getAttribute("data-title") || c.textContent || "").toLowerCase();
    const addedAt = c => new Date(c.getAttribute("data-added-at") || 0);
    const isFav = c => {
      try {
        const favs = new Set(JSON.parse(localStorage.getItem("xsf_favs_v1") || "[]"));
        return favs.has(c.getAttribute("data-id"));
      } catch { return false; }
    };

    // --- State ---
    let state = { q: "", filter: "all" };

    function apply() {
      const cards = getCards();
      if (!cards.length) return;

      if (state.filter === "recent") {
        [...cards].sort((a, b) => addedAt(b) - addedAt(a)).forEach(c => grid.appendChild(c));
      }

      cards.forEach(c => {
        const matchQ = !state.q || titleOf(c).includes(state.q);
        const matchFav = state.filter !== "favs" || isFav(c);
        c.style.display = (matchQ && matchFav) ? "" : "none";
      });
    }

    // --- Wire events ---
    document.getElementById("so-search").addEventListener("input", e => {
      state.q = e.target.value.toLowerCase();
      apply();
    });
    controls.querySelectorAll(".so-pill").forEach(btn =>
      btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter;
        apply();
      })
    );

    // Listen for hearts changes
    window.addEventListener("storage", e => {
      if (e.key === "xsf_favs_v1") apply();
    });
  });
})();
