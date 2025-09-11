/* public/js/phase9.js
   Phase 9 — Step 7: Polish
   - Active tab highlight + ring
   - Hover/pressed states (via Tailwind classes already in HTML)
   - Live counters on tabs (All / Recently Added / Favorites)
   - Keyboard nav for tabs (←/→, Enter/Space)
   - Reset Demo button (clears demo data)
*/

(() => {
  const MOVIES_KEY = 'xsf_movies_v1';
  let currentTab = 'all'; // 'all' | 'recent' | 'favorites'

  // ----------
  // Utilities
  // ----------
  const nowTs = () => Date.now();

  function readMovies() {
    try {
      const raw = localStorage.getItem(MOVIES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr)
        ? arr.map(m => ({
            id: m.id ?? (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)),
            title: (m.title ?? '').trim(),
            posterUrl: (m.posterUrl ?? '').trim(),
            favorite: !!m.favorite,
            addedAt: typeof m.addedAt === 'number' ? m.addedAt : nowTs(),
          }))
        : [];
    } catch {
      return [];
    }
  }

  function writeMovies(movies) {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(movies));
    document.dispatchEvent(new CustomEvent('xsf:movies-updated'));
  }

  function setFavorite(id, value) {
    const movies = readMovies();
    const idx = movies.findIndex(m => m.id === id);
    if (idx !== -1) {
      movies[idx].favorite = !!value;
      writeMovies(movies);
    }
  }

  function deleteMovie(id) {
    writeMovies(readMovies().filter(m => m.id === id ? false : true));
  }

  // Poster fallback (inline SVG, no external asset)
  const FALLBACK_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
        <rect width="100%" height="100%" fill="#111"/>
        <rect x="40" y="40" width="720" height="1120" fill="#1f2937" rx="24"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, Helvetica, sans-serif" font-size="42">No Poster</text>
      </svg>`
    );
  const posterSrc = (url) => (url && url.trim()) ? url.trim() : FALLBACK_SVG;

  // ----------
  // Rendering
  // ----------
  function updateTabCounts() {
    const movies = readMovies();
    const allCount = movies.length;
    const favCount = movies.filter(m => m.favorite).length;

    // "Recently Added" is the same total, but we display sorted by addedAt
    const recentCount = allCount;

    const elAll = document.getElementById('countAll');
    const elRecent = document.getElementById('countRecent');
    const elFavs = document.getElementById('countFavs');

    if (elAll) elAll.textContent = String(allCount);
    if (elRecent) elRecent.textContent = String(recentCount);
    if (elFavs) elFavs.textContent = String(favCount);
  }

  function renderTabs() {
    const tabAll = document.getElementById('tabAll');
    const tabRecent = document.getElementById('tabRecent');
    const tabFavs = document.getElementById('tabFavs');

    const tabs = [
      { el: tabAll, key: 'all' },
      { el: tabRecent, key: 'recent' },
      { el: tabFavs, key: 'favorites' },
    ];

    tabs.forEach(({ el, key }) => {
      if (!el) return;
      const active = currentTab === key;
      el.setAttribute('aria-selected', String(active));
      el.classList.toggle('bg-red-600', active);
      el.classList.toggle('text-white', active);
      el.classList.toggle('border-red-600', active);
      el.classList.toggle('ring-2', active);
      el.classList.toggle('ring-red-600/60', active);

      // Badge style: brighten when active
      const badge = el.querySelector('.tab-badge');
      if (badge) {
        badge.classList.toggle('border-zinc-700', !active);
        badge.classList.toggle('border-red-300', active);
        badge.classList.toggle('text-zinc-300', !active);
        badge.classList.toggle('text-white', active);
        badge.classList.toggle('bg-red-600/20', active);
      }
    });
  }

  function sortAndFilter(movies) {
    let list = [...movies];
    if (currentTab === 'favorites') {
      list = list.filter(m => !!m.favorite).sort((a, b) => b.addedAt - a.addedAt);
    } else if (currentTab === 'recent') {
      list.sort((a, b) => b.addedAt - a.addedAt);
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    }
    return list;
  }

  function renderGrid() {
    const grid = document.getElementById('vaultGrid');
    if (!grid) return;

    const movies = readMovies();
    const list = sortAndFilter(movies);

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div class="text-2xl font-semibold text-gray-300">Nothing here yet</div>
          <div class="text-gray-400 mt-2">Add a movie to see it in your Vault.</div>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(m => `
      <div class="group relative rounded-2xl overflow-hidden bg-zinc-900/60 border border-zinc-800 shadow-sm">
        <button
          type="button"
          class="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-black/60 hover:bg-black/80 active:scale-[0.98] transition border border-zinc-700 delete-btn"
          aria-label="Delete"
          data-id="${m.id}">
          <span class="text-zinc-300 group-hover:text-white text-lg leading-none">✕</span>
        </button>

        <button
          type="button"
          class="absolute top-2 left-2 z-10 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-black/60 hover:bg-black/80 active:scale-[0.98] transition border border-zinc-700 fav-btn"
          aria-label="Toggle favorite"
          aria-pressed="${m.favorite ? 'true' : 'false'}"
          data-id="${m.id}">
          <span class="text-xl leading-none select-none">${m.favorite ? '❤️' : '🤍'}</span>
        </button>

        <div class="aspect-[2/3] w-full bg-zinc-950">
          <img
            src="${posterSrc(m.posterUrl)}"
            alt="${m.title ? m.title.replace(/"/g, '&quot;') : 'Poster'}"
            class="h-full w-full object-cover"
            onerror="this.onerror=null; this.src='${FALLBACK_SVG}';" />
        </div>

        <div class="p-3 border-t border-zinc-800">
          <div class="text-sm text-zinc-400">Added: ${new Date(m.addedAt).toLocaleDateString()}</div>
          <div class="mt-1 text-base font-semibold text-zinc-100 truncate" title="${m.title || 'Untitled'}">${m.title || 'Untitled'}</div>
        </div>
      </div>
    `).join('');
  }

  function renderAll() {
    updateTabCounts();
    renderTabs();
    renderGrid();
  }

  // ----------
  // Events
  // ----------
  function handleTabClick(key) {
    currentTab = key;
    renderAll();
  }

  function onGridClick(e) {
    const del = e.target.closest('.delete-btn');
    const fav = e.target.closest('.fav-btn');

    if (del) {
      deleteMovie(del.dataset.id);
      renderAll();
      return;
    }
    if (fav) {
      const id = fav.dataset.id;
      const movies = readMovies();
      const item = movies.find(m => m.id === id);
      if (item) {
        setFavorite(id, !item.favorite);
        renderAll();
      }
    }
  }

  function onTabKeydown(e) {
    const order = ['tabAll', 'tabRecent', 'tabFavs'];
    const idx = order.indexOf(document.activeElement?.id);
    if (idx === -1) return;

    if (e.key === 'ArrowRight') {
      const next = document.getElementById(order[(idx + 1) % order.length]);
      next?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const prev = document.getElementById(order[(idx - 1 + order.length) % order.length]);
      prev?.focus();
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement?.id === 'tabAll') handleTabClick('all');
      if (document.activeElement?.id === 'tabRecent') handleTabClick('recent');
      if (document.activeElement?.id === 'tabFavs') handleTabClick('favorites');
      e.preventDefault();
    }
  }

  // Optional: Reset Demo clears movies and refreshes UI
  function onResetDemo() {
    localStorage.removeItem(MOVIES_KEY);
    document.dispatchEvent(new CustomEvent('xsf:movies-updated'));
  }

  // Listen to Step-3/4/5 events (saving, deleting, etc.)
  document.addEventListener('xsf:movie-added', renderAll);
  document.addEventListener('xsf:movies-updated', renderAll);

  // ----------
  // Init
  // ----------
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tabAll')?.addEventListener('click', () => handleTabClick('all'));
    document.getElementById('tabRecent')?.addEventListener('click', () => handleTabClick('recent'));
    document.getElementById('tabFavs')?.addEventListener('click', () => handleTabClick('favorites'));

    document.getElementById('tabAll')?.addEventListener('keydown', onTabKeydown);
    document.getElementById('tabRecent')?.addEventListener('keydown', onTabKeydown);
    document.getElementById('tabFavs')?.addEventListener('keydown', onTabKeydown);

    document.getElementById('vaultGrid')?.addEventListener('click', onGridClick);
    document.getElementById('resetDemo')?.addEventListener('click', onResetDemo);

    renderAll();
  });
})();
