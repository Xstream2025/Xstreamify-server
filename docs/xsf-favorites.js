/* xsf-favorites.js — STRICT scope + DE-DUPE + built-in Favorites view */
console.log("xsf-favorites.js strict+dedupe loaded");

(function () {
  // ---- CSS (hearts + favorites view) ----
  const css = `
  .tile,.movie-card,.poster-tile,[data-fav-target]{position:relative}
  .heart-overlay{
    position:absolute; top:.5rem; right:.5rem;
    padding:.35rem; border-radius:9999px;
    background:rgba(0,0,0,.35); opacity:.9;
    transition:transform .15s ease, opacity .15s ease;
    transform:scale(.95); z-index:60;
  }
  .tile:hover .heart-overlay,
  .movie-card:hover .heart-overlay,
  .poster-tile:hover .heart-overlay,
  [data-fav-target]:hover .heart-overlay{opacity:1; transform:scale(1)}
  .heart-overlay svg{display:block;width:1.5rem;height:1.5rem}
  .heart-overlay .heart-on{display:none}
  .favorited .heart-on{display:block}
  .favorited .heart-off{display:none}
  .poster-tile :is(.heart,.favorite,.fav,.fav-btn,.favorite-btn,
                   i[class*="heart"],i[class*="fav"]) { display:none !important; }
  /* ⭐ Favorites view: hide non-favorites when body has .view-favs */
  .view-favs .poster-tile:not(.favorited),
  .view-favs .movie-card:not(.favorited),
  .view-favs .tile:not(.favorited),
  .view-favs [data-fav-target]:not(.favorited){ display:none !important; }
  #xsf-empty{grid-column:1/-1;padding:1rem;text-align:center;opacity:.8}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Storage helpers ----
  const KEY = "xsf_favs_v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const write = (m) => localStorage.setItem(KEY, JSON.stringify(m));
  const favs = read();

  // ---- Heart button (clean path for both states) ----
  const BTN_HTML = `
  <button class="heart-overlay" type="button" aria-label="Add to Favorites" data-fav-btn>
    <svg class="heart-off" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <svg class="heart-on" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
            fill="#ef4444" />
    </svg>
  </button>`;

  // ---- Scope ----
  const EXCLUDE_MATCH = (el) =>
    el.closest("nav, header, footer, .navbar, .site-header, .logo, [role='navigation']");
  const candidates = () =>
    Array.from(document.querySelectorAll(".poster-tile, .movie-card, .tile, [data-fav-target]"));

  // ---- Helpers ----
  function getId(tile) {
    if (tile.dataset.id) return tile.dataset.id;
    const img = tile.querySelector("img");
    const key = (img && (img.currentSrc || img.src)) ||
                tile.getAttribute("style") ||
                tile.outerHTML.slice(0, 160);
    const id = btoa(encodeURIComponent(key)).slice(0, 10);
    tile.dataset.id = id; return id;
  }

  function applyState(tile, on) {
    tile.classList.toggle("favorited", !!on);
    const btn = tile.querySelector("[data-fav-btn]");
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.title = on ? "Remove from Favorites" : "Add to Favorites";
    }
  }

  function removeExistingHearts(tile) {
    tile.querySelectorAll(
      "[data-fav-btn], .heart-overlay, .favorite, .favorite-btn, .fav-btn, .fav, .like-btn, .wishlist"
    ).forEach(el => el.remove());
    tile.querySelectorAll("i,span,button,svg").forEach(el => {
      const html = (el.outerHTML || "").toLowerCase();
      if (html.includes("heart") || html.includes("fav")) el.remove();
    });
    tile.querySelectorAll("*").forEach(el => {
      const s = getComputedStyle(el);
      const w = parseFloat(s.width) || 0, h = parseFloat(s.height) || 0;
      if ((s.position === "absolute" || s.position === "fixed") &&
          (s.right !== "auto" || parseFloat(s.right) === 0) &&
          (s.top !== "auto" || parseFloat(s.top) === 0) &&
          w <= 48 && h <= 48 &&
          !el.matches("[data-fav-btn], .heart-overlay")) el.remove();
    });
  }

  function attach(tile) {
    if (!tile || tile.nodeType !== 1) return;
    if (tile.getAttribute("data-xsf-ready") === "1") return;
    if (EXCLUDE_MATCH(tile)) return;

    tile.setAttribute("data-xsf-ready", "1");
    if (getComputedStyle(tile).position === "static") tile.style.position = "relative";

    removeExistingHearts(tile);
    tile.insertAdjacentHTML("beforeend", BTN_HTML);

    const id = getId(tile);
    applyState(tile, !!favs[id]);

    tile.querySelector("[data-fav-btn]").addEventListener("click", (e) => {
      e.stopPropagation();
      const next = !tile.classList.contains("favorited");
      if (next) favs[id] = { t: Date.now(), title: tile.getAttribute("data-title") || "" };
      else delete favs[id];
      applyState(tile, next);
      write(favs);
      if (document.body.classList.contains("view-favs")) queueMicrotask(updateFavView);
    });
  }

  function scanOnce() {
    candidates().forEach(attach);
    const hero = document.querySelector("[data-hero-fav]"); // optional
    if (hero) attach(hero);
    wireFavView();
    console.log("favorites (strict+dedupe): attached");
  }

  // ---- Built-in Favorites View (CSS toggle) ----
  function linkByText(txt) {
    return Array.from(document.querySelectorAll("a,button"))
      .find(el => el.textContent.trim().toLowerCase() === txt);
  }

  function updateFavView() {
    const tiles = candidates();
    const shown = tiles.filter(t => t.classList.contains("favorited")).length;
    const grid = document.querySelector(".grid") || document.body;
    let msg = document.getElementById("xsf-empty");
    if (document.body.classList.contains("view-favs") && shown === 0) {
      if (!msg) {
        msg = document.createElement("div");
        msg.id = "xsf-empty";
        msg.textContent = "No favorites yet.";
        grid.appendChild(msg);
      }
    } else if (msg) msg.remove();
  }

  function wireFavView() {
    const fav = document.getElementById("linkFav") || linkByText("favorites");
    const all = document.getElementById("linkAll") || linkByText("all");

    fav?.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.add("view-favs");
      updateFavView();
    });
    all?.addEventListener("click", (e) => {
      e.preventDefault();
      document.body.classList.remove("view-favs");
      updateFavView();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanOnce, { once: true });
  } else {
    scanOnce();
  }
  // Auto-attach hearts to tiles added after load (light observer)
const mo = new MutationObserver((muts) => {
  for (const m of muts) {
    for (const n of m.addedNodes) {
      if (!(n instanceof HTMLElement)) continue;
      if (n.matches(".poster-tile, .movie-card, .tile, [data-fav-target]")) attach(n);
      n.querySelectorAll(".poster-tile, .movie-card, .tile, [data-fav-target]").forEach(attach);
    }
  }
});
mo.observe(document.body, { childList: true, subtree: true });
})();
