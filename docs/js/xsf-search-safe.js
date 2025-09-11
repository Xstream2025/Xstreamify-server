// public/js/xsf-search-safe.js
// Read-only overlay: filters EXISTING tiles without touching heart logic.
// It waits for DOM ready, finds your grid/cards heuristically, and only hides/shows.

(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  ready(() => {
    // ---- Find the grid that holds your movie cards (robust guesses)
    const grid =
      $("#library-grid") ||
      $("#moviesGrid") ||
      $("[data-grid='library']") ||
      $(".movies-grid") ||
      // fallback: the first large grid under main
      $("main .grid, section .grid, #app .grid");

    if (!grid) {
      console.warn("[xsf-search] No grid container found. Skipping search overlay.");
      return;
    }

    // ---- Controls UI (inserted ABOVE grid, does nothing until you interact)
    const bar = document.createElement("div");
    bar.id = "xsf-search-controls";
    bar.className = "max-w-7xl mx-auto px-4 mt-4 mb-3 flex flex-wrap items-center gap-2";
    bar.innerHTML = `
      <input id="xsf-search" type="text" placeholder="Search your library..."
             class="flex-1 min-w-[220px] bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:border-red-500" />
      <div class="flex gap-2">
        <button id="xsf-pill-all" class="px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">All</button>
        <button id="xsf-pill-recent" class="px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Recently Added</button>
        <button id="xsf-pill-favs" class="px-3 py-2 rounded-xl border border-zinc-800 hover:border-red-500 text-sm">Favorites</button>
      </div>
    `;
    grid.parentElement.insertBefore(bar, grid);

    // ---- How to detect your cards/titles/favorites without changing them
    const getCards = () => {
      // Prefer elements that look like your movie tiles:
      let cards = $all(".card, .movie-card, [data-card='movie'], .tile, .movie", grid);
      if (!cards.length) {
        // Fallback: parent of any heart button or any node with data-id
        const heartParents = $all(".fav-btn, .favorite, [data-fav='btn']", grid)
          .map(b => b.closest("[data-card], .card, article, li, div"));
        const withId = $all("[data-id]", grid);
        cards = Array.from(new Set([...heartParents, ...withId])).filter(Boolean);
      }
      // Final fallback: images as tiles
      if (!cards.length) cards = $all("article, li, a, div", grid).filter(el => el.querySelector("img"));
      return cards;
    };

    const titleOf = (card) => {
      const t = card.querySelector(".title, .movie-title, [data-title]") || card;
      const byAttr = card.getAttribute("data-title");
      return (byAttr || t.textContent || "").trim().toLowerCase();
    };

    const addedAtOf = (card) => {
      const v = card.getAttribute("data-added-at") || card.dataset?.addedAt || "";
      const d = v ? new Date(v) : null;
      return d && !isNaN(d) ? d : null;
    };

    const isFav = (card) => {
      // Phase 6 favorites key
      const id = card.getAttribute("data-id") || card.dataset?.id;
      if (!id) return false;
      try {
        const favs = new Set(JSON.parse(localStorage.getItem("xsf_favs_v1") || "[]"));
        return favs.has(id);
      } catch {
        return false;
      }
    };

    // ---- State + apply (non-destructive: only style.display toggles)
    let state = { q: "", filter: "none" }; // none|all|recent|favs
    function apply() {
      const cards = getCards();
      if (!cards.length) return;

      const doAnything = state.q || state.filter === "recent" || state.filter === "favs";
      if (!doAnything) {
        cards.forEach(c => c.style.display = ""); // show everything unchanged
        return;
      }

      if (state.filter === "recent") {
        // Only visual re-order — re-appending nodes (keeps events/heart handlers intact)
        [...cards]
          .sort((a, b) => (addedAtOf(b) || new Date(0)) - (addedAtOf(a) || new Date(0)))
          .forEach(el => grid.appendChild(el));
      }

      cards.forEach(card => {
        const matchQ = !state.q || titleOf(card).includes(state.q);
        const matchFav = state.filter !== "favs" || isFav(card);
        card.style.display = (matchQ && matchFav) ? "" : "none";
      });
    }

    // ---- Wire inputs
    const input = $("#xsf-search");
    $("#xsf-pill-all").addEventListener("click",  () => { state.filter = "all";   apply(); });
    $("#xsf-pill-recent").addEventListener("click",() => { state.filter = "recent";apply(); });
    $("#xsf-pill-favs").addEventListener("click",  () => { state.filter = "favs";  apply(); });
    input.addEventListener("input", (e) => { state.q = (e.target.value || "").trim().toLowerCase(); apply(); });

    // Re-apply if favorites change in another tab/window
    window.addEventListener("storage", (e) => { if (e.key === "xsf_favs_v1") apply(); });

    // Do NOTHING until user interacts (state.filter stays "none")
  });
})();
