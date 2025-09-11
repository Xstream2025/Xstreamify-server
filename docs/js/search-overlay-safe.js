// public/js/search-overlay-safe.js
// Zero-impact until user interacts. No DOM changes on load. Fully try/catch guarded.

(() => {
  try {
    const onReady = (fn) =>
      document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", fn)
        : fn();

    onReady(() => {
      // Find your grid (read-only)
      const grid =
        document.querySelector("#library-grid") ||
        document.querySelector("#moviesGrid") ||
        document.querySelector("[data-grid='library']") ||
        document.querySelector(".movies-grid");

      if (!grid) return; // No grid? Do nothing.

      // Insert controls ABOVE the grid
      const controls = document.createElement("div");
      controls.id = "xsf-search-controls";
      controls.className = "max-w-7xl mx-auto px-4 mt-4 mb-3 flex flex-wrap items-center gap-2";
      controls.innerHTML = `
        <input id="xsf-search" type="text" placeholder="Search your library..."
               class="flex-1 min-w-[220px] bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
        <div class="flex gap-2">
          <button data-filter="all"    class="xsf-pill px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">All</button>
          <button data-filter="recent" class="xsf-pill px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Recently Added</button>
          <button data-filter="favs"   class="xsf-pill px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Favorites</button>
        </div>
      `;
      grid.parentElement.insertBefore(controls, grid);

      // Helpers (read-only)
      const getCards = () => Array.from(grid.querySelectorAll("[data-id]"));
      const titleOf = (c) =>
        (c.getAttribute("data-title") || c.textContent || "").trim().toLowerCase();
      const addedAt = (c) => {
        const v = c.getAttribute("data-added-at") || c.dataset?.addedAt || "";
        const d = v ? new Date(v) : null;
        return d && !isNaN(d) ? d : null;
      };
      const isFav = (c) => {
        try {
          const favs = new Set(JSON.parse(localStorage.getItem("xsf_favs_v1") || "[]"));
          return favs.has(c.getAttribute("data-id") || "");
        } catch {
          return false;
        }
      };

      // State — start “idle”, so NOTHING HAPPENS until user acts
      let state = { q: "", filter: "idle" }; // idle|all|recent|favs

      // Apply — only toggles display when you interact; NO changes on load
      function apply() {
        if (state.filter === "idle" && !state.q) return; // still idle → do nothing
        const cards = getCards();
        if (!cards.length) return;

        if (state.filter === "recent") {
          // Visual reorder only (re-append); keeps event handlers intact
          [...cards]
            .sort((a, b) => (addedAt(b) || 0) - (addedAt(a) || 0))
            .forEach((el) => grid.appendChild(el));
        }

        const q = state.q;
        const favMode = state.filter === "favs";
        cards.forEach((c) => {
          const okQ = !q || titleOf(c).includes(q);
          const okFav = !favMode || isFav(c);
          c.style.display = okQ && okFav ? "" : "none";
        });
      }

      // Wire events — this is the ONLY time apply() runs
      const input = document.getElementById("xsf-search");
      input.addEventListener("input", (e) => {
        state.q = (e.target.value || "").trim().toLowerCase();
        if (state.filter === "idle") state.filter = "all";
        apply();
      });

      controls.querySelectorAll(".xsf-pill").forEach((btn) =>
        btn.addEventListener("click", () => {
          state.filter = btn.dataset.filter || "all";
          apply();
        })
      );

      // Re-apply if favorites change (other tab)
      window.addEventListener("storage", (e) => {
        if (e.key === "xsf_favs_v1") apply();
      });
    });
  } catch {
    // Any error → do nothing. Hearts/UI remain untouched.
  }
})();
