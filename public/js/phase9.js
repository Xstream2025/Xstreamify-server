/* X-Streamify — Phase 10 Step 4 (Polish)
   - Confirmations for deletes & import
   - Disabled states + tidy focus rings
   - Small hints & toasts
   - Keyboard: "/" focuses search
*/

(() => {
  // ---------- State ----------
  const LS_KEY = "xsf_library_v1";
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /** @type {{id:string,title:string,year?:number,poster?:string,tags?:string[],fav?:boolean,addedAt:number}[]} */
  let library = load() || [];
  let view = "all"; // all | recent | favs
  let query = "";
  let sort = "added_desc";
  let bulkMode = false;
  let selectedIds = new Set();
  let editingId = null;

  // ---------- Elements ----------
  const grid = $("#grid");
  const emptyState = $("#emptyState");
  const searchInput = $("#search");
  const sortSelect = $("#sort");
  const tabBtns = $$(".tab-btn");
  const addBtn = $("#addMovieBtn");
  const exportBtn = $("#exportBtn");
  const importFile = $("#importFile");
  const bulkSelectBtn = $("#bulkSelect");
  const bulkFavBtn = $("#bulkFavorite");
  const bulkDeleteBtn = $("#bulkDelete");
  const modal = $("#modal");
  const movieForm = $("#movieForm");
  const modalTitle = $("#modalTitle");
  const toastHost = $("#toastHost");

  // ---------- Utils ----------
  function save() {
    localStorage.setItem(LS_KEY, JSON.stringify(library));
  }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }
  function showToast(msg) {
    const el = document.createElement("div");
    el.className =
      "pointer-events-auto max-w-[92vw] sm:max-w-md rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm shadow";
    el.textContent = msg;
    toastHost.appendChild(el);
    setTimeout(() => {
      el.classList.add("opacity-0");
      el.style.transition = "opacity .4s";
      setTimeout(() => el.remove(), 400);
    }, 1600);
  }
  function confirmBox(message) {
    return window.confirm(message);
  }
  function fmtCount(n) {
    return n === 1 ? "1 item" : `${n} items`;
  }
  function normalize(str) {
    return (str || "").toLowerCase().trim();
  }

  // ---------- Rendering ----------
  function applyFilters(items) {
    let out = items;

    // View filter
    if (view === "recent") {
      // last 14 days
      const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
      out = out.filter(m => m.addedAt >= cutoff);
    } else if (view === "favs") {
      out = out.filter(m => !!m.fav);
    }

    // Search
    if (query) {
      const q = normalize(query);
      out = out.filter(m => {
        const inTitle = normalize(m.title).includes(q);
        const inYear = String(m.year || "").includes(q);
        const inTags = (m.tags || []).some(t => normalize(t).includes(q));
        return inTitle || inYear || inTags;
      });
    }

    // Sort
    out = out.slice();
    switch (sort) {
      case "title_asc": out.sort((a,b) => a.title.localeCompare(b.title)); break;
      case "title_desc": out.sort((a,b) => b.title.localeCompare(a.title)); break;
      case "year_asc": out.sort((a,b) => (a.year||0) - (b.year||0)); break;
      case "year_desc": out.sort((a,b) => (b.year||0) - (a.year||0)); break;
      default: // added_desc
        out.sort((a,b) => b.addedAt - a.addedAt);
    }
    return out;
  }

  function posterSrc(m) {
    if (m.poster && m.poster.startsWith("http")) return m.poster;
    // subtle fallback
    const initials = encodeURIComponent((m.title||"?").slice(0,1).toUpperCase());
    return `https://dummyimage.com/300x450/0a0a0a/ffffff.png&text=${initials}`;
  }

  function render() {
    const items = applyFilters(library);
    grid.innerHTML = "";
    emptyState.classList.toggle("hidden", items.length > 0);

    items.forEach(m => {
      const card = document.createElement("div");
      card.className = "group relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950";
      card.setAttribute("data-id", m.id);

      // Poster
      const img = document.createElement("img");
      img.src = posterSrc(m);
      img.alt = `${m.title} poster`;
      img.className = "w-full aspect-[2/3] object-cover bg-neutral-900";
      img.onerror = () => { img.src = posterSrc({title:m.title}); };
      card.appendChild(img);

      // Overlay corner buttons (hover)
      const overlay = document.createElement("div");
      overlay.className = "pointer-events-none absolute inset-0 p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity";
      overlay.innerHTML = `
        <div class="flex justify-end gap-1">
          <button title="Delete" data-act="delete" class="pointer-events-auto rounded-lg px-2 py-1 text-sm bg-neutral-950/80 border border-neutral-800 hover:bg-neutral-900">✕</button>
        </div>
        <div class="flex justify-between items-end">
          <button title="Select" data-act="select" class="pointer-events-auto rounded-lg px-2 py-1 text-sm bg-neutral-950/80 border border-neutral-800 hover:bg-neutral-900">☐</button>
          <div class="flex gap-1">
            <button title="${m.fav ? "Unfavorite" : "Favorite"}" data-act="fav" class="pointer-events-auto rounded-lg px-2 py-1 text-sm ${m.fav ? "text-red-400 border-red-700" : "text-neutral-200 border-neutral-800"} bg-neutral-950/80 border hover:bg-neutral-900">♥</button>
            <button title="Edit" data-act="edit" class="pointer-events-auto rounded-lg px-2 py-1 text-sm bg-neutral-950/80 border border-neutral-800 hover:bg-neutral-900">✎</button>
          </div>
        </div>
      `;
      card.appendChild(overlay);

      // Meta row
      const meta = document.createElement("div");
      meta.className = "px-2 py-2";
      meta.innerHTML = `
        <div class="flex items-center gap-2">
          <h3 class="font-medium truncate" title="${m.title}">${m.title}</h3>
          ${m.year ? `<span class="text-xs text-neutral-400">${m.year}</span>` : ""}
          ${m.fav ? `<span class="ml-auto text-xs text-red-400">♥</span>` : ""}
        </div>
        ${m.tags?.length ? `<p class="mt-1 text-xs text-neutral-500 truncate">${m.tags.join(", ")}</p>` : ""}
      `;
      card.appendChild(meta);

      grid.appendChild(card);
    });

    updateBulkButtons();
  }

  function updateBulkButtons() {
    const hasSel = selectedIds.size > 0;
    bulkFavBtn.disabled = !hasSel;
    bulkDeleteBtn.disabled = !hasSel;
    bulkSelectBtn.textContent = bulkMode ? "Exit Select" : "Select";
  }

  // ---------- Modal ----------
  function openModal(mode, movie = null) {
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");

    if (mode === "add") {
      editingId = null;
      modalTitle.textContent = "Add Movie";
      movieForm.title.value = "";
      movieForm.year.value = "";
      movieForm.poster.value = "";
      movieForm.tags.value = "";
    } else {
      editingId = movie.id;
      modalTitle.textContent = "Edit Movie";
      movieForm.title.value = movie.title || "";
      movieForm.year.value = movie.year || "";
      movieForm.poster.value = movie.poster || "";
      movieForm.tags.value = (movie.tags || []).join(", ");
    }

    // focus title
    setTimeout(() => movieForm.title.focus(), 0);
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  }

  // ---------- Actions ----------
  function addMovie(data) {
    library.push({
      id: uid(),
      title: (data.title || "").trim(),
      year: data.year ? Number(data.year) : undefined,
      poster: (data.poster || "").trim(),
      tags: data.tags ? data.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      fav: false,
      addedAt: Date.now(),
    });
    save();
    render();
    showToast("Movie added.");
  }

  function updateMovie(id, data) {
    const idx = library.findIndex(m => m.id === id);
    if (idx >= 0) {
      library[idx] = {
        ...library[idx],
        title: (data.title || "").trim(),
        year: data.year ? Number(data.year) : undefined,
        poster: (data.poster || "").trim(),
        tags: data.tags ? data.tags.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      save();
      render();
      showToast("Movie updated.");
    }
  }

  function deleteMovie(id) {
    const m = library.find(x => x.id === id);
    const name = m?.title ? ` “${m.title}”` : "";
    if (!confirmBox(`Delete${name} from your vault?`)) return;
    library = library.filter(m => m.id !== id);
    selectedIds.delete(id);
    save();
    render();
    showToast("Movie deleted.");
  }

  function toggleFav(id, quiet = false) {
    const m = library.find(x => x.id === id);
    if (!m) return;
    m.fav = !m.fav;
    save();
    render();
    if (!quiet) showToast(m.fav ? "Added to Favorites." : "Removed from Favorites.");
  }

  // ---------- Bulk ----------
  function setBulkMode(on) {
    bulkMode = on;
    selectedIds.clear();
    document.body.classList.toggle("select-mode", bulkMode);
    render();
  }

  function bulkFavorite() {
    if (selectedIds.size === 0) return;
    selectedIds.forEach(id => toggleFav(id, true));
    showToast("Favorites updated for " + fmtCount(selectedIds.size) + ".");
    render();
  }

  function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirmBox(`Delete ${fmtCount(selectedIds.size)} from your vault? This cannot be undone.`)) return;
    library = library.filter(m => !selectedIds.has(m.id));
    selectedIds.clear();
    save();
    render();
    showToast("Deleted selected items.");
  }

  // ---------- Import / Export ----------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "xstreamify-library.json";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Exported library JSON.");
  }

  function importJSON(file) {
    if (!file) return;
    const replacing = library.length > 0;
    const msg = replacing
      ? "Importing will REPLACE your current library. Continue?"
      : "Import this library?";
    if (!confirmBox(msg)) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error("Invalid format");
        // basic sanitize
        library = data.map(x => ({
          id: x.id || uid(),
          title: String(x.title || "").trim(),
          year: x.year ? Number(x.year) : undefined,
          poster: String(x.poster || "").trim(),
          tags: Array.isArray(x.tags) ? x.tags.map(t => String(t)) : [],
          fav: !!x.fav,
          addedAt: x.addedAt ? Number(x.addedAt) : Date.now(),
        }));
        save();
        render();
        showToast("Import complete.");
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  // ---------- Events ----------
  // Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      view = btn.dataset.tab;
      tabBtns.forEach(b => {
        if (b === btn) {
          b.classList.add("bg-neutral-800","border-neutral-600");
        } else {
          b.classList.remove("bg-neutral-800","border-neutral-600");
        }
      });
      render();
    });
  });

  // Search / Sort
  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    render();
  });
  sortSelect.addEventListener("change", () => {
    sort = sortSelect.value;
    render();
  });

  // Keyboard — focus search with "/"
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Add
  addBtn.addEventListener("click", () => openModal("add"));
  $("[data-close]", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  movieForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(movieForm).entries());
    if (editingId) updateMovie(editingId, data);
    else addMovie(data);
    closeModal();
  });

  // Grid delegation
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const card = e.target.closest("[data-id]");
    if (!card) return;
    const id = card.getAttribute("data-id");
    const act = btn.dataset.act;

    if (act === "delete") deleteMovie(id);
    if (act === "fav") toggleFav(id);
    if (act === "edit") {
      const m = library.find(x => x.id === id);
      if (m) openModal("edit", m);
    }
    if (act === "select") {
      setBulkMode(true);
      if (selectedIds.has(id)) selectedIds.delete(id);
      else selectedIds.add(id);
      // Visual selection ring
      card.classList.toggle("ring-2");
      card.classList.toggle("ring-red-500");
      updateBulkButtons();
    }
  });

  // Bulk
  bulkSelectBtn.addEventListener("click", () => {
    if (bulkMode) {
      setBulkMode(false);
    } else {
      setBulkMode(true);
      showToast("Tap posters (☐) to select.");
    }
  });
  bulkFavBtn.addEventListener("click", bulkFavorite);
  bulkDeleteBtn.addEventListener("click", bulkDelete);

  // Export / Import
  exportBtn.addEventListener("click", exportJSON);
  importFile.addEventListener("change", (e) => importJSON(e.target.files[0]));

  // ---------- First render ----------
  // Default tab highlight
  tabBtns.forEach(b => b.classList.toggle("bg-neutral-800", b.dataset.tab === "all"));
  tabBtns.forEach(b => b.classList.toggle("border-neutral-600", b.dataset.tab === "all"));
  render();
})();
