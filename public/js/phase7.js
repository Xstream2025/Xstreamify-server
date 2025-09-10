const LIB_KEY = "xsf_library_v1";
const FAVS_KEY = "xsf_favs_v1";

const seed = [
  { id: "m1", title: "Spirited Away",       year: 2001, featured: true,  addedAt: "2025-08-25" },
  { id: "m2", title: "Interstellar",        year: 2014, featured: true,  addedAt: "2025-09-05" },
  { id: "m3", title: "The Dark Knight",     year: 2008, featured: true,  addedAt: "2025-09-01" },
  { id: "m4", title: "Arrival",             year: 2016, featured: false, addedAt: "2025-09-07" },
  { id: "m5", title: "Whiplash",            year: 2014, featured: false, addedAt: "2025-08-15" },
  { id: "m6", title: "Blade Runner 2049",   year: 2017, featured: false, addedAt: "2025-09-02" }
];

function loadLib() {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (!raw) { localStorage.setItem(LIB_KEY, JSON.stringify(seed)); return [...seed]; }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(LIB_KEY, JSON.stringify(seed));
      return [...seed];
    }
    return parsed;
  } catch {
    localStorage.setItem(LIB_KEY, JSON.stringify(seed));
    return [...seed];
  }
}
function saveLib(list) { localStorage.setItem(LIB_KEY, JSON.stringify(list)); }
function getFavs() { try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || "[]")); } catch { return new Set(); } }

let library = loadLib();

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const featuredRow = $("#p7-featured");
const grid        = $("#p7-grid");
const empty       = $("#p7-empty");
const search      = $("#p7-search");
const pills       = $$(".p7-pill");
const fileInput   = $("#p7-file");
const addBtn      = $("#p7-add-btn");

function setActivePill(name) {
  pills.forEach(b => b.classList.remove("p7-pill-active"));
  const idMap = { all: "#p7-pill-all", recent: "#p7-pill-recent", favs: "#p7-pill-favs" };
  const btn = document.querySelector(idMap[name] || idMap.all);
  if (btn) btn.classList.add("p7-pill-active");
}
function updateCount(n) { const chip = document.getElementById("p7-count-chip"); if (chip) chip.textContent = String(n); }

function poster(letter) {
  return `
    <div class="aspect-[2/3] w-full rounded-xl bg-gradient-to-br from-zinc-900 to-black
                border border-zinc-800 grid place-items-center text-5xl font-bold text-white/20">
      ${letter}
    </div>`;
}
function card(m) {
  const favs = getFavs();
  const isFav = favs.has(m.id);
  return `
    <div class="group rounded-xl overflow-hidden border border-zinc-800 hover:border-red-500/50 transition"
         data-id="${m.id}" data-title="${m.title}" data-added-at="${m.addedAt || ""}">
      <div class="relative">
        ${poster((m.title || "?").charAt(0))}
        <button data-id="${m.id}"
                class="absolute top-2 right-2 text-xl ${isFav ? "text-red-500" : "text-white/40"} p7-fav">♥</button>
      </div>
      <div class="p-2 text-sm">
        <div class="font-semibold">${m.title}</div>
        <div class="text-white/50">${m.year || ""}</div>
      </div>
    </div>`;
}

function renderFeatured(list) {
  const picks = (list ?? library).filter(s => s.featured).slice(0, 6);
  featuredRow.innerHTML = picks.map(card).join("");
}
function renderGrid(list) {
  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
  } else {
    empty.classList.add("hidden");
    grid.innerHTML = list.map(card).join("");
  }
  updateCount(list.length);
}

let state = { q: "", filter: "all" };

function computeList() {
  let list = [...library];
  const q = state.q.toLowerCase();
  if (q) list = list.filter(m => (m.title || "").toLowerCase().includes(q));
  if (state.filter === "recent") {
    list.sort((a,b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  } else if (state.filter === "favs") {
    const favs = getFavs();
    list = list.filter(m => favs.has(m.id));
  }
  return list;
}
function apply() {
  setActivePill(state.filter);
  const list = computeList();
  renderFeatured(list);
  renderGrid(list);
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("p7-fav")) {
    const id = e.target.getAttribute("data-id");
    const favs = getFavs();
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));
    apply();
  }
});

search.addEventListener("input", (e) => { state.q = e.target.value.trim(); apply(); });
search.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { state.q = ""; search.value = ""; state.filter = "all"; apply(); }
});

pills.forEach(b => b.addEventListener("click", () => {
  const f = b.dataset.filter || "all";
  state.filter = f;
  if (f === "all") { state.q = ""; search.value = ""; }
  apply();
}));

addBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const filename = f.name.replace(/\.[^.]+$/, "");
  const id = "u_" + Math.random().toString(36).slice(2, 9);
  const nowISO = new Date().toISOString().slice(0,10);
  const item = { id, title: filename, year: "", featured: false, addedAt: nowISO };
  library.unshift(item);
  saveLib(library);
  apply();
  fileInput.value = "";
});

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Alt") {                 // Reset with Alt
    state.q = "";
    search.value = "";
    state.filter = "all";
    apply();
    return;
  }
  if (e.target === search) return;       // don't hijack typing in the search box
  if (e.key.toLowerCase() === "a") { state.filter = "all";    state.q=""; search.value=""; apply(); }
  if (e.key.toLowerCase() === "r") { state.filter = "recent"; apply(); }
  if (e.key.toLowerCase() === "f") { state.filter = "favs";   apply(); }
});

renderFeatured();
apply();
