// public/xsf-favorites.js
console.log("✅ xsf-favorites.js loaded (locked grids + hero)");

(function () {
  // ---------- CSS ----------
  const css = `
    .tile{position:relative}
    .heart-overlay{transition:transform .15s ease,opacity .15s ease; z-index:60}
    .tile:hover .heart-overlay{opacity:1;transform:scale(1)}
    .heart-overlay{opacity:0;transform:scale(.95)}
    .tile.favorited .heart-overlay{opacity:1}
    .heart-overlay svg{display:block;width:1.5rem;height:1.5rem} /* ~24px */
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- storage ----------
  const KEY = "xsf_favs_v1";
  const read  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const write = m  => localStorage.setItem(KEY, JSON.stringify(m));
  const favs  = read();

  // ---------- heart button ----------
  const BTN_HTML = `
  <button class="heart-overlay absolute right-2 top-2 p-2 rounded-full bg-black/60 hover:bg-black/80 ring-1 ring-white/10 text-white"
          data-fav-btn aria-pressed="false" title="Add to Favorites">
    <!-- outline -->
    <svg class="heart-off" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.919 0-3.555 1.064-4.312 2.625-.757-1.561-2.393-2.625-4.312-2.625C4.1 3.75 2 5.765 2 8.25c0 6.188 7.5 10.5 9 11.25 1.5-.75 9-5.062 9-11.25Z"/>
    </svg>
    <!-- solid red -->
    <svg class="heart-on hidden" viewBox="0 0 24 24" fill="#ef4444" aria-hidden="true">
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.919 0-3.555 1.064-4.312 2.625-.757-1.561-2.393-2.625-4.312-2.625C4.1 3.75 2 5.765 2 8.25c0 6.188 7.5 10.5 9 11.25 1.5-.75 9-5.062 9-11.25Z"/>
    </svg>
  </button>`;

  // ---------- helpers ----------
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

  const isPortrait = el => {
    const r = el.getBoundingClientRect();
    return r.height > r.width * 1.05 && r.height > 120;
  };
  const hasImgOrBG = el => {
    if (el.querySelector("img")) return true;
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== "none") return true;
    for (const n of el.querySelectorAll("*")) {
      const cs = getComputedStyle(n);
      if (n.tagName === "IMG" || (cs.backgroundImage && cs.backgroundImage !== "none")) return true;
    }
    return false;
  };

  // Always resolve any element inside a grid card to the grid cell root.
  const tileRoot = (node) =>
    node.closest(".grid > *") ||
    node.closest("a,figure,article,div,section") ||
    node;

  // Normalize: remove/move stray overlays so each root has at most one, directly under it
  function normalizeHearts() {
    // Remove any overlay not sitting directly under its root
    Array.from(document.querySelectorAll("[data-fav-btn]")).forEach(btn => {
      const root = tileRoot(btn);
      if (!root || btn.parentElement !== root) btn.remove();
    });

    // If a root somehow still has more than one, keep the last
    const byRoot = new Map();
    Array.from(document.querySelectorAll(".grid > *")).forEach(root => byRoot.set(root, []));
    Array.from(document.querySelectorAll("[data-fav-btn]")).forEach(btn => {
      const root = tileRoot(btn);
      if (root) {
        const arr = byRoot.get(root) || [];
        arr.push(btn);
        byRoot.set(root, arr);
      }
    });
    byRoot.forEach((arr, root) => {
      if (arr.length > 1) arr.slice(0, -1).forEach(b => b.remove());
      if (arr.length) root.setAttribute("data-fav-root", "");
    });
  }

  function attach(tile) {
    if (!tile) return;

    // If this root (or its descendants) already have any overlays, clean them out first.
    const existing = tile.querySelectorAll("[data-fav-btn]");
    if (existing.length) existing.forEach(b => b.remove());

    // Hard de-dupe: if an ancestor root already exists with a button, skip
    if (tile.closest("[data-fav-root]") && tile.closest("[data-fav-root]") !== tile) return;

    tile.setAttribute("data-fav-root", "");

    if (!isPortrait(tile) || !hasImgOrBG(tile)) return;

    tile.classList.add("tile");
    if (getComputedStyle(tile).position === "static") tile.style.position = "relative";

    if (!tile.getAttribute("data-id")) {
      const img = tile.querySelector("img");
      const key = (img?.currentSrc) || img?.getAttribute("src") || tile.getAttribute("style") || tile.outerHTML.slice(0, 120);
      const safe = btoa(unescape(encodeURIComponent(key))).slice(0, 8);
      tile.setAttribute("data-id", "auto-" + safe);
    }

    tile.insertAdjacentHTML("beforeend", BTN_HTML);
    const id = tile.getAttribute("data-id");
    applyState(tile, !!favs[id]);

    tile.querySelector("[data-fav-btn]")?.addEventListener("click", e => {
      e.stopPropagation();
      const next = !tile.classList.contains("favorited");
      if (next) { favs[id] = { t: Date.now(), title: tile.getAttribute("data-title") || "" }; }
      else      { delete favs[id]; }
      applyState(tile, next);
      write(favs);
    });
  }

  // ---------- scan ----------
  function scan() {
    // Normalize first to eliminate any leftovers from earlier runs
    normalizeHearts();

    const found = new Set();

    // explicit sections
    ["#vault", "#featured", "#library"].forEach(sel => {
      const sec = document.querySelector(sel);
      if (!sec) return;
      sec.querySelectorAll(".grid > *").forEach(el => found.add(tileRoot(el)));
    });

    // IMG parents
    document.querySelectorAll("img").forEach(img => found.add(tileRoot(img)));

    // background-image blocks
    document.querySelectorAll("[style*='background-image'], [class*='bg-cover'], [class*='bg-center']")
      .forEach(el => found.add(tileRoot(el)));

    // broad: anything inside grids
    document.querySelectorAll(".grid > *").forEach(el => found.add(tileRoot(el)));

    // attach once per root
    found.forEach(el => attach(el));

    // hero (top banner) — deduped
    (function hero() {
      const heroImg = Array.from(document.images)
        .filter(img => {
          const r = img.getBoundingClientRect();
          return r.top < window.innerHeight * 0.75 && r.width > 400 && r.height > 220;
        })
        .sort((a, b) => {
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          return (rb.width * rb.height) - (ra.width * ra.height);
        })[0];

      if (!heroImg) return;
      const anchor = heroImg.closest("figure, .relative, .rounded-2xl, .rounded-xl, div, section") || heroImg.parentElement || heroImg;
      if (anchor.querySelector("[data-fav-btn]")) return; // already has one
      if (getComputedStyle(anchor).position === "static") anchor.style.position = "relative";
      attach(anchor);
    })();
  }

  // initial + dynamic
  scan();
  const mo = new MutationObserver(() => scan());
  mo.observe(document.documentElement, { childList: true, subtree: true });

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { scan(); ticking = false; });
    }
  }, { passive: true });
})();
