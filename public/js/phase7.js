/* Phase 7 Sandbox JS */

/* Keys */
const LIB_KEY = "xsf_library_v1";
/* separate favorites per section so hearts act independently */
const FAV_FEAT_KEY = "xsf_favs_featured_v1";
const FAV_SAND_KEY = "xsf_favs_sandbox_v1";

/* State */
let activeFilter = "all";
let library = loadLib();
let favsByScope = {
  featured: loadFavs(FAV_FEAT_KEY),
  sandbox:  loadFavs(FAV_SAND_KEY),
};

/* Shorthands */
const qs = (s) => document.querySelector(s);
const sandboxRow = () => qs("#sandboxRow");
const featuredRow = () => qs("#featuredRow");
const si = () => qs("#searchInput");
const rc = () => qs("#resultCount");
const empty = () => qs("#emptyState");

/* Storage */
function loadLib() {
  try { return JSON.parse(localStorage.getItem(LIB_KEY)) || seedLibrary(); }
  catch { return seedLibrary(); }
}
function saveLib(v) { localStorage.setItem(LIB_KEY, JSON.stringify(v)); }

function loadFavs(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function saveFavs(key, v) { localStorage.setItem(key, JSON.stringify(v)); }

/* Seed content */
function seedLibrary() {
  const today = new Date().toISOString().slice(0,10);
  const y = (d) => new Date(Date.now() - d*86400000).toISOString().slice(0,10);
  const seeded = [
    { id:"m1", title:"Spirited Away",   year:"2001", featured:true,  addedAt:y(20) },
    { id:"m2", title:"Interstellar",    year:"2014", featured:true,  addedAt:y(8)  },
    { id:"m3", title:"The Dark Knight", year:"2008", featured:true,  addedAt:y(2)  },
    { id:"m4", title:"Arrival",         year:"2016", featured:false, addedAt:today },
    { id:"m5", title:"Whiplash",        year:"2014", featured:false, addedAt:y(40) },
    { id:"m6", title:"Blade Runner 2049", year:"2017", featured:false, addedAt:y(100) },
  ];
  localStorage.setItem(LIB_KEY, JSON.stringify(seeded));
  return seeded;
}

/* Rendering */
function movieCard(item, scope) {
  const liked = favsByScope[scope].includes(item.id);
  return `
    <div class="bg-white/5 rounded-xl p-3 shadow group">
      <div class="aspect-[2/3] rounded-lg bg-white/10 mb-2 relative overflow-hidden">
        <button
          class="absolute top-2 right-2 rounded-full px-2 py-1 text-xs bg-black/60 border border-white/20 hover:opacity-90"
          data-like="${scope}:${item.id}"
        >${liked ? "❤️" : "🤍"}</button>
      </div>
      <div class="text-sm font-medium">${item.title}</div>
      <div class="text-xs text-white/60">${item.year || ""}</div>
    </div>
  `;
}

function attachLikeHandlers(scope, container) {
  container.querySelectorAll("[data-like]").forEach(btn => {
    btn.addEventListener("click", () => {
      const token = btn.getAttribute("data-like");      // e.g. "featured:m1"
      const [sc, id] = token.split(":");
      const arr = favsByScope[sc];
      const i = arr.indexOf(id);
      if (i === -1) arr.push(id); else arr.splice(i, 1);
      saveFavs(sc === "featured" ? FAV_FEAT_KEY : FAV_SAND_KEY, arr);
      if (sc === "featured") renderFeatured(); else apply();
    });
  });
}

/* Featured */
function renderFeatured() {
  const node = featuredRow();
  if (!node) return;
  const items = library.filter(m => m.featured);
  node.innerHTML = items.map(m => movieCard(m, "featured")).join("");
  attachLikeHandlers("featured", node);
}

/* Sandbox filter */
function currentFilterPredicate() {
  const q = (si()?.value || "").trim().toLowerCase();
  return (m) => {
    const matchesText = !q || m.title.toLowerCase().includes(q);
    if (!matchesText) return false;
    if (activeFilter === "recent") {
      const fourteen = Date.now() - 14*86400000;
      return new Date(m.addedAt + "T00:00:00").getTime() >= fourteen;
    }
    if (activeFilter === "favorites") {
      return favsByScope.sandbox.includes(m.id);
    }
    return true;
  };
}

/* Sandbox render */
function apply() {
  const node = sandboxRow();
  if (!node) return;
  const filtered = library.filter(currentFilterPredicate());
  node.innerHTML = filtered.map(m => movieCard(m, "sandbox")).join("");
  attachLikeHandlers("sandbox", node);

  if (rc()) rc().textContent = String(filtered.length);
  if (empty()) empty().classList.toggle("hidden", filtered.length !== 0);

  setActivePill();
}

/* Pills (make active one bolder; all start with same base look in HTML) */
function setActivePill() {
  const map = { all:"#pillAll", recent:"#pillRecent", favorites:"#pillFav" };
  Object.entries(map).forEach(([k, sel]) => {
    const el = qs(sel);
    if (!el) return;
    const on = k === activeFilter;
    el.classList.toggle("ring-2", on);
    el.classList.toggle("ring-red-500", on);
    el.classList.toggle("bg-red-500/10", on);
  });
}

/* Wireup */
document.addEventListener("DOMContentLoaded", () => {
  renderFeatured();
  apply();

  if (si()) si().addEventListener("input", apply);

  [["#pillAll","all"],["#pillRecent","recent"],["#pillFav","favorites"]]
    .forEach(([sel, mode]) => {
      const el = qs(sel);
      if (el) el.addEventListener("click", () => { activeFilter = mode; apply(); });
    });

  const fi = qs("#fileInput");
  if (fi) {
    fi.addEventListener("change", () => {
      const f = fi.files && fi.files[0];
      if (!f) return;
      const name = f.name.replace(/\.[^.]+$/, "");
      const nowISO = new Date().toISOString().slice(0,10);
      const id = "u_" + Math.random().toString(36).slice(2, 9);
      library.unshift({ id, title: name, year: "", featured: false, addedAt: nowISO });
      saveLib(library);
      fi.value = "";
      renderFeatured();
      apply();
    });
  }

  /* Keyboard shortcuts */
  window.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    const inField = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
    const k = e.key.toLowerCase();

    if (!inField) {
      if (k === "a") { activeFilter = "all"; apply(); return; }
      if (k === "r") { activeFilter = "recent"; apply(); return; }
      if (k === "f") { activeFilter = "favorites"; apply(); return; }
    }
    if (k === "escape") {
      if (si()) si().value = "";
      activeFilter = "all";
      apply();
    }
  });
});
