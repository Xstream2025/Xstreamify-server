console.log("✅ xsf-favorites.js loaded (auto-scan mode)");

(function () {
  // --- Minimal CSS for the overlay only
  const css = `
  .tile{position:relative}
  .heart-overlay{transition:transform .15s ease,opacity .15s ease; z-index:60}
  .tile:hover .heart-overlay{opacity:1;transform:scale(1)}
  .heart-overlay{opacity:0;transform:scale(.95)}
  .tile.favorited .heart-overlay{opacity:1}
`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const KEY = "xsf_favs_v1";
  const read  = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const write = (m) => localStorage.setItem(KEY, JSON.stringify(m));
  const favs  = read();

  const BTN_HTML = `
    <button class="heart-overlay absolute right-2 top-2 p-2 rounded-full bg-black/60 hover:bg-black/80 ring-1 ring-white/10 text-white" data-fav-btn aria-label="Toggle Favorite">
      <!-- outline -->
      <svg class="heart-off h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
      <!-- solid red -->
      <svg class="heart-on h-5 w-5 hidden" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    </button>`;

  function applyState(tile, isFav) {
    const on  = tile.querySelector(".heart-on");
    const off = tile.querySelector(".heart-off");
    const b   = tile.querySelector("[data-fav-btn]");
    tile.classList.toggle("favorited", !!isFav);
    if (on && off) { on.classList.toggle("hidden", !isFav); off.classList.toggle("hidden", !!isFav); }
    if (b) {
      b.setAttribute("aria-pressed", isFav ? "true" : "false");
      b.title = isFav ? "Remove from Favorites" : "Add to Favorites";
    }
  }

  // Heuristics
  const isPortrait = (el) => {
    const r = el.getBoundingClientRect();
    return r.height > r.width * 1.05 && r.height > 120;
  };
  const hasImgOrBG = (el) => {
    if (el.querySelector("img")) return true;
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== "none") return true;
    // sometimes the image sits in a child
    for (const n of el.querySelectorAll("*")) {
      const cs = getComputedStyle(n);
      if (n.tagName === "IMG" || (cs.backgroundImage && cs.backgroundImage !== "none")) return true;
    }
    return false;
  };
  const cardWrapper = (node) =>
    node.closest("a,figure,article,div,section") || node.parentElement || node;

  // Attach a heart to a candidate element if not already
  function attach(tile) {
    if (!tile) return;
    if (!isPortrait(tile) || !hasImgOrBG(tile)) return; // skip non-posters

    tile.classList.add("tile");
    if (getComputedStyle(tile).position === "static") tile.style.position = "relative";

    if (!tile.getAttribute("data-id")) {
      const img = tile.querySelector("img");
      const key = (img?.currentSrc) || tile.getAttribute("style") || tile.outerHTML.slice(0, 120);
      const safe = btoa(unescape(encodeURIComponent(key))).slice(0, 8);
      tile.setAttribute("data-id", "auto-" + safe);
    }
    if (tile.querySelector("[data-fav-btn]")) return; // already injected

    tile.insertAdjacentHTML("beforeend", BTN_HTML);
    const id = tile.getAttribute("data-id");
    applyState(tile, !!favs[id]);

    tile.querySelector("[data-fav-btn]").addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !tile.classList.contains("favorited");
      if (next) { favs[id] = { t: Date.now(), title: tile.getAttribute("data-title") || "" }; }
      else { delete favs[id]; }
      applyState(tile, next);
      write(favs);
    });
  }

  // Scan function (runs now and whenever DOM changes)
  function scan() {
    const found = new Set();
// Explicit section grids
['#vault', '#featured', '#library'].forEach(sel=>{
  const sec = document.querySelector(sel);
  if(!sec) return;
  sec.querySelectorAll('.grid > *').forEach(el => found.add(cardWrapper(el)));
});
    // A) All images: use a safe wrapper
    document.querySelectorAll("img").forEach((img) => {
      const card = cardWrapper(img);
      if (card) found.add(card);
    });

    // B) Background-image blocks and their wrappers
    document.querySelectorAll("[style*='background-image'], [class*='bg-cover'], [class*='bg-center']").forEach((el) => {
      found.add(cardWrapper(el));
    });

    // C) Any obvious grid children (broad fallback)
    document.querySelectorAll(".grid > *").forEach((el) => found.add(cardWrapper(el)));

    let count = 0;
    found.forEach((el) => { attach(el); count++; });
    console.log("🔎 favorites scan – candidates:", count);
  }

  // Initial + periodic scans (handles lazy/dynamic content)
  scan();
  const mo = new MutationObserver(() => scan());
  mo.observe(document.documentElement, { childList: true, subtree: true });
  // Also rescan on scroll (when lazy items render)
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { scan(); ticking = false; });
    }
  }, { passive: true });

})();
