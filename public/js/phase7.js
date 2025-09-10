// Phase 7 sandbox page — standalone. Reads favs from xsf_favs_v1 (your existing hearts).

const sample = [
  { id: "m1", title: "Spirited Away", year: 2001, featured: true,  addedAt: "2025-08-25" },
  { id: "m2", title: "Interstellar",  year: 2014, featured: true,  addedAt: "2025-09-05" },
  { id: "m3", title: "The Dark Knight", year: 2008, featured: true, addedAt: "2025-09-01" },
  { id: "m4", title: "Arrival",       year: 2016, featured: false, addedAt: "2025-09-07" },
  { id: "m5", title: "Whiplash",      year: 2014, featured: false, addedAt: "2025-08-15" },
  { id: "m6", title: "Blade Runner 2049", year: 2017, featured: false, addedAt: "2025-09-02" }
];

const $ = (s, r=document) => r.querySelector(s);
const featuredRow = $("#p7-featured");
const grid = $("#p7-grid");
const empty = $("#p7-empty");
const search = $("#p7-search");
const pills = document.querySelectorAll(".p7-pill");

const FAVS_KEY = "xsf_favs_v1";
const getFavs = () => {
  try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) || "[]")); }
  catch { return new Set(); }
};

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
         data-id="${m.id}" data-title="${m.title}" data-added-at="${m.addedAt}">
      <div class="relative">
        ${poster(m.title.charAt(0))}
        <button data-id="${m.id}"
                class="absolute top-2 right-2 text-xl ${isFav ? "text-red-500" : "text-white/40"} p7-fav">
          ♥
        </button>
      </div>
      <div class="p-2 text-sm">
        <div class="font-semibold">${m.title}</div>
        <div class="text-white/50">${m.year}</div>
      </div>
    </div>`;
}

function renderFeatured() {
  featuredRow.innerHTML = sample.filter(s => s.featured).map(card).join("");
}
function renderGrid(list) {
  if (!list.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");
  grid.innerHTML = list.map(card).join("");
}

let state = { q: "", filter: "all" }; // all|recent|favs

function apply() {
  let list = [...sample];
  if (state.q) {
    const q = state.q.toLowerCase();
    list = list.filter(m => m.title.toLowerCase().includes(q));
  }
  if (state.filter === "recent") {
    list.sort((a,b) => new Date(b.addedAt) - new Date(a.addedAt));
  } else if (state.filter === "favs") {
    const favs = getFavs();
    list = list.filter(m => favs.has(m.id));
  }
  renderGrid(list);
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("p7-fav")) {
    const id = e.target.getAttribute("data-id");
    const favs = getFavs();
    if (favs.has(id)) favs.delete(id); else favs.add(id);
    localStorage.setItem(FAVS_KEY, JSON.stringify([...favs]));
    apply();      // refresh grid view
    renderFeatured(); // refresh featured hearts
  }
});

search.addEventListener("input", (e) => { state.q = e.target.value.trim(); apply(); });
pills.forEach(b => b.addEventListener("click", () => { state.filter = b.dataset.filter; apply(); }));

// init
renderFeatured();
apply();
