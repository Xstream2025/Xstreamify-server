/* public/js/phase9.js
   Phase 9 — Step 8 final (heart on RIGHT, delete on LEFT)
*/
(() => {
  const MOVIES_KEY = 'xsf_movies_v1';
  const TAB_KEY = 'xsf_tab_v1';
  let currentTab = readTab();

  // Utils
  const nowTs = () => Date.now();
  const uid = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'id_' + Math.random().toString(36).slice(2);

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

  function normalizeMovie(m) {
    return {
      id: m.id ?? uid(),
      title: (m.title ?? '').trim(),
      posterUrl: (m.posterUrl ?? '').trim(),
      favorite: !!m.favorite,
      addedAt: typeof m.addedAt === 'number' ? m.addedAt : nowTs(),
    };
  }
  function readMovies() {
    try {
      const raw = localStorage.getItem(MOVIES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(normalizeMovie) : [];
    } catch { return []; }
  }
  function writeMovies(movies) {
    localStorage.setItem(MOVIES_KEY, JSON.stringify(movies.map(normalizeMovie)));
    document.dispatchEvent(new CustomEvent('xsf:movies-updated'));
  }
  function readTab() {
    const t = localStorage.getItem(TAB_KEY);
    return t === 'recent' || t === 'favorites' ? t : 'all';
  }
  function writeTab(tab) {
    currentTab = tab;
    localStorage.setItem(TAB_KEY, tab);
  }

  function setFavorite(id, value) {
    const movies = readMovies();
    const idx = movies.findIndex(m => m.id === id);
    if (idx !== -1) { movies[idx].favorite = !!value; writeMovies(movies); }
  }
  function deleteMovie(id) { writeMovies(readMovies().filter(m => m.id !== id)); }

  // Rendering
  function updateTabCounts() {
    const movies = readMovies();
    const all = movies.length;
    const fav = movies.filter(m => m.favorite).length;
    const elAll = document.getElementById('countAll');
    const elRecent = document.getElementById('countRecent');
    const elFavs = document.getElementById('countFavs');
    if (elAll) elAll.textContent = String(all);
    if (elRecent) elRecent.textContent = String(all);
    if (elFavs) elFavs.textContent = String(fav);
  }
  function renderTabs() {
    [['tabAll','all'],['tabRecent','recent'],['tabFavs','favorites']].forEach(([id,key])=>{
      const el = document.getElementById(id); if (!el) return;
      const active = currentTab === key;
      el.setAttribute('aria-selected', String(active));
      el.classList.toggle('bg-red-600', active);
      el.classList.toggle('text-white', active);
      el.classList.toggle('border-red-600', active);
      el.classList.toggle('ring-2', active);
      el.classList.toggle('ring-red-600/60', active);
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
    const list = [...movies];
    if (currentTab === 'favorites') return list.filter(m=>m.favorite).sort((a,b)=>b.addedAt-a.addedAt);
    if (currentTab === 'recent')    return list.sort((a,b)=>b.addedAt-a.addedAt);
    return list.sort((a,b)=>a.title.localeCompare(b.title, undefined, {sensitivity:'base'}));
  }
  function renderGrid() {
    const grid = document.getElementById('vaultGrid'); if (!grid) return;
    const list = sortAndFilter(readMovies());
    if (!list.length) {
      grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
        <div class="text-2xl font-semibold text-gray-300">Nothing here yet</div>
        <div class="text-gray-400 mt-2">Add a movie to see it in your Vault.</div>
      </div>`;
      return;
    }
    grid.innerHTML = list.map(m=>`
      <div class="group relative rounded-2xl overflow-hidden bg-zinc-900/60 border border-zinc-800 shadow-sm">
        <!-- ✕ on LEFT -->
        <button type="button"
          class="absolute top-2 left-2 z-10 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-black/60 hover:bg-black/80 active:scale-[0.98] transition border border-zinc-700 delete-btn"
          aria-label="Delete" data-id="${m.id}">
          <span class="text-zinc-300 group-hover:text-white text-lg leading-none">✕</span>
        </button>

        <!-- ❤️ on RIGHT -->
        <button type="button"
          class="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-black/60 hover:bg-black/80 active:scale-[0.98] transition border border-zinc-700 fav-btn"
          aria-label="Toggle favorite" aria-pressed="${m.favorite ? 'true' : 'false'}" data-id="${m.id}">
          <span class="text-xl leading-none select-none">${m.favorite ? '❤️' : '🤍'}</span>
        </button>

        <div class="aspect-[2/3] w-full bg-zinc-950">
          <img src="${posterSrc(m.posterUrl)}"
               alt="${m.title ? m.title.replace(/"/g,'&quot;') : 'Poster'}"
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
  function renderAll(){ updateTabCounts(); renderTabs(); renderGrid(); }

  // Events
  function handleTabClick(key){ writeTab(key); renderAll(); }
  function onGridClick(e){
    const del = e.target.closest('.delete-btn');
    const fav = e.target.closest('.fav-btn');
    if (del){ deleteMovie(del.dataset.id); renderAll(); return; }
    if (fav){
      const id = fav.dataset.id, movies = readMovies(), item = movies.find(m=>m.id===id);
      if (item){ setFavorite(id, !item.favorite); renderAll(); }
    }
  }
  function onTabKeydown(e){
    const order=['tabAll','tabRecent','tabFavs']; const idx=order.indexOf(document.activeElement?.id);
    if (idx===-1) return;
    if (e.key==='ArrowRight'){ document.getElementById(order[(idx+1)%order.length])?.focus(); e.preventDefault(); }
    else if (e.key==='ArrowLeft'){ document.getElementById(order[(idx-1+order.length)%order.length])?.focus(); e.preventDefault(); }
    else if (e.key==='Enter' || e.key===' '){
      const id=document.activeElement?.id;
      if (id==='tabAll') handleTabClick('all');
      if (id==='tabRecent') handleTabClick('recent');
      if (id==='tabFavs') handleTabClick('favorites');
      e.preventDefault();
    }
  }
  function onResetDemo(){ localStorage.removeItem(MOVIES_KEY); writeTab('all'); document.dispatchEvent(new CustomEvent('xsf:movies-updated')); }

  document.addEventListener('xsf:movie-added', renderAll);
  document.addEventListener('xsf:movies-updated', renderAll);

  document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('tabAll')?.addEventListener('click', ()=>handleTabClick('all'));
    document.getElementById('tabRecent')?.addEventListener('click', ()=>handleTabClick('recent'));
    document.getElementById('tabFavs')?.addEventListener('click', ()=>handleTabClick('favorites'));

    document.getElementById('tabAll')?.addEventListener('keydown', onTabKeydown);
    document.getElementById('tabRecent')?.addEventListener('keydown', onTabKeydown);
    document.getElementById('tabFavs')?.addEventListener('keydown', onTabKeydown);

    document.getElementById('vaultGrid')?.addEventListener('click', onGridClick);
    document.getElementById('resetDemo')?.addEventListener('click', onResetDemo);

    renderAll();
  });

  // Tiny QA helpers
  window.xsf = Object.freeze({
    getMovies: () => readMovies(),
    addMovie: (title, posterUrl='') => {
      const movies = readMovies();
      movies.push(normalizeMovie({ title, posterUrl, favorite:false, addedAt: nowTs() }));
      writeMovies(movies);
    },
    clear: () => onResetDemo(),
    setTab: (t) => handleTabClick(t),
  });
})();
