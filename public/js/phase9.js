/* public/js/phase9.js
   Phase 10 — Step 4: Bulk select + actions (with change-handler fix)
   - Select mode toggle
   - Checkboxes on cards when selecting
   - Bulk Favorite / Unfavorite / Delete bar with live count
   - Esc exits select mode
   - Works with tabs + search + sort + edit + favorite + delete
*/
(() => {
  const MOVIES_KEY = 'xsf_movies_v1';
  const TAB_KEY    = 'xsf_tab_v1';
  const SEARCH_KEY = 'xsf_search_v1';
  const SORT_KEY   = 'xsf_sort_v1';

  // State
  let currentTab = readTab();
  let searchText = readSearch();
  let sortKey    = readSort();
  let editingId  = null;

  // Bulk-select state (in-memory)
  let selectMode = false;
  const selectedIds = new Set();

  // ----- utils -----
  const nowTs = () => Date.now();
  const uid = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'id_' + Math.random().toString(36).slice(2);

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
    exitSelectMode(); // leave select mode on tab switch to keep things simple
  }

  function readSearch() { return (localStorage.getItem(SEARCH_KEY) || '').trim(); }
  function writeSearch(txt) {
    searchText = (txt || '').trim();
    localStorage.setItem(SEARCH_KEY, searchText);
  }

  function readSort() {
    const s = localStorage.getItem(SORT_KEY);
    return ['title-az','title-za','recent-desc','fav-first'].includes(s) ? s : 'title-az';
  }
  function writeSort(s) {
    sortKey = s;
    localStorage.setItem(SORT_KEY, sortKey);
  }

  function setFavorite(id, value) {
    const movies = readMovies();
    const idx = movies.findIndex(m => m.id === id);
    if (idx !== -1) { movies[idx].favorite = !!value; writeMovies(movies); }
  }
  function deleteMovie(id) { writeMovies(readMovies().filter(m => m.id !== id)); }

  // Poster fallback
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

  // ----- rendering helpers -----
  function updateTabCounts() {
    const movies = readMovies();
    const all = movies.length;
    const fav = movies.filter(m => m.favorite).length;
    const elAll    = document.getElementById('countAll');
    const elRecent = document.getElementById('countRecent');
    const elFavs   = document.getElementById('countFavs');
    if (elAll)    elAll.textContent    = String(all);
    if (elRecent) elRecent.textContent = String(all);
    if (elFavs)   elFavs.textContent   = String(fav);
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

  function filterByTab(movies) {
    if (currentTab === 'favorites') return movies.filter(m => m.favorite);
    return movies; // 'all' and 'recent' include all
  }

  function effectiveSortKey() {
    return currentTab === 'recent' ? 'recent-desc' : sortKey;
  }
  function renderSortUI() {
    const sel = document.getElementById('vaultSort');
    if (!sel) return;
    sel.value = effectiveSortKey();
    sel.disabled = currentTab === 'recent';
  }

  function applySort(list) {
    const s = effectiveSortKey();
    if (s === 'recent-desc') return [...list].sort((a,b)=>b.addedAt - a.addedAt);
    if (s === 'title-za')    return [...list].sort((a,b)=>b.title.localeCompare(a.title, undefined, {sensitivity:'base'}));
    if (s === 'fav-first')   return [...list].sort((a,b)=>(b.favorite - a.favorite) || (b.addedAt - a.addedAt));
    return [...list].sort((a,b)=>a.title.localeCompare(b.title, undefined, {sensitivity:'base'})); // title-az
  }

  function applySearch(list) {
    const q = (searchText || '').toLowerCase();
    if (!q) return list;
    return list.filter(m => (m.title || '').toLowerCase().includes(q));
  }

  function updateSearchUI() {
    const input = document.getElementById('vaultSearch');
    const clear = document.getElementById('clearSearch');
    if (input) input.value = searchText;
    if (clear) clear.classList.toggle('hidden', !searchText);
  }

  function updateBulkUI() {
    const bar = document.getElementById('bulkBar');
    const cnt = document.getElementById('bulkCount');
    const toggle = document.getElementById('bulkToggle');
    if (!bar || !cnt || !toggle) return;

    cnt.textContent = String(selectedIds.size);
    bar.classList.toggle('hidden', !selectMode);
    toggle.textContent = selectMode ? 'Selecting…' : 'Select';
  }

  function renderGrid() {
    const grid = document.getElementById('vaultGrid'); if (!grid) return;
    const base = filterByTab(readMovies());
    const searched = applySearch(base);
    const sorted = applySort(searched);

    if (!sorted.length) {
      grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
          <div class="text-2xl font-semibold text-gray-300">Nothing here yet</div>
          <div class="text-gray-400 mt-2">Add a movie or change your search/sort.</div>
        </div>`;
      return;
    }

    grid.innerHTML = sorted.map(m => {
      const selected = selectedIds.has(m.id);
      return `
        <div class="group relative rounded-2xl overflow-hidden bg-zinc-900/60 border ${selected ? 'ring-2 ring-red-500/60 border-red-700' : 'border-zinc-800'} shadow-sm">
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

          <!-- ✎ bottom-right -->
          <button type="button"
            class="absolute bottom-2 right-2 z-10 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-black/60 hover:bg-black/80 active:scale-[0.98] transition border border-zinc-700 edit-btn"
            aria-label="Edit" data-id="${m.id}">
            <span class="text-lg leading-none text-zinc-300 group-hover:text-white">✎</span>
          </button>

          <!-- Bulk select checkbox (only visible in select mode) -->
          ${selectMode ? `
            <input type="checkbox" class="sel-box h-4 w-4 rounded border-zinc-600 bg-zinc-900" data-id="${m.id}" ${selected ? 'checked' : ''} />
          ` : ''}

          <div class="aspect-[2/3] w-full bg-zinc-950">
            <img
              src="${posterSrc(m.posterUrl)}"
              alt="${m.title ? m.title.replace(/"/g,'&quot;') : 'Poster'}"
              class="h-full w-full object-cover"
              onerror="this.onerror=null; this.src='${FALLBACK_SVG}';" />
          </div>

          <div class="p-3 border-t border-zinc-800">
            <div class="text-sm text-zinc-400">Added: ${new Date(m.addedAt).toLocaleDateString()}</div>
            <div class="mt-1 text-base font-semibold text-zinc-100 truncate" title="${m.title || 'Untitled'}">${m.title || 'Untitled'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderAll() {
    updateTabCounts();
    renderTabs();
    renderSortUI();
    updateSearchUI();
    updateBulkUI();
    renderGrid();
  }

  // ----- Edit modal -----
  function el(id){ return document.getElementById(id); }
  function openEditModal(movie){
    editingId = movie.id;
    el('editTitle').value = movie.title || '';
    el('editPosterUrl').value = movie.posterUrl || '';
    el('editFavorite').checked = !!movie.favorite;
    el('editPosterPreview').src = posterSrc(movie.posterUrl);
    el('editModal').classList.remove('hidden');
  }
  function closeEditModal(){
    editingId = null;
    el('editModal').classList.add('hidden');
  }
  function onEditSave(){
    if (!editingId) return closeEditModal();
    const title = el('editTitle').value.trim();
    const posterUrl = el('editPosterUrl').value.trim();
    const favorite = !!el('editFavorite').checked;
    const movies = readMovies();
    const idx = movies.findIndex(m => m.id === editingId);
    if (idx !== -1) {
      movies[idx] = normalizeMovie({ ...movies[idx], title, posterUrl, favorite });
      writeMovies(movies);
    }
    closeEditModal();
  }
  function onEditPosterInput(){
    const v = el('editPosterUrl').value.trim();
    el('editPosterPreview').src = posterSrc(v);
  }

  // ----- Select mode helpers -----
  function enterSelectMode(){ selectMode = true; updateBulkUI(); renderGrid(); }
  function exitSelectMode(){ selectMode = false; selectedIds.clear(); updateBulkUI(); renderGrid(); }

  // ----- events -----
  function handleTabClick(key){ writeTab(key); renderAll(); }

  function onGridClick(e){
    const del = e.target.closest('.delete-btn');
    const fav = e.target.closest('.fav-btn');
    const edt = e.target.closest('.edit-btn');

    if (del){ deleteMovie(del.dataset.id); renderAll(); return; }
    if (fav){
      const id = fav.dataset.id, movies = readMovies(), item = movies.find(m=>m.id===id);
      if (item){ setFavorite(id, !item.favorite); renderAll(); return; }
    }
    if (edt){
      const id = edt.dataset.id, movies = readMovies(), item = movies.find(m=>m.id===id);
      if (item){ openEditModal(item); }
      return;
    }
  }

  // *** NEW: handle checkbox state reliably ***
  function onGridChange(e){
    const target = e.target;
    if (!target || !target.classList || !target.classList.contains('sel-box')) return;
    const id = target.dataset.id;
    if (!id) return;
    if (target.checked) selectedIds.add(id);
    else selectedIds.delete(id);
    updateBulkUI();
    renderGrid(); // reflect ring highlight immediately
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
  function onResetDemo(){ localStorage.removeItem(MOVIES_KEY); exitSelectMode(); writeTab('all'); document.dispatchEvent(new CustomEvent('xsf:movies-updated')); }

  // Search events
  function onSearchInput(e){ writeSearch(e.currentTarget.value || ''); renderGrid(); updateSearchUI(); }
  function onSearchClear(){ writeSearch(''); renderAll(); el('vaultSearch')?.focus(); }
  function onSearchKeydown(e){ if (e.key === 'Escape'){ onSearchClear(); } }

  // Sort events
  function onSortChange(e){ writeSort(e.currentTarget.value); renderGrid(); }

  // Bulk events
  function onBulkToggle(){ selectMode ? exitSelectMode() : enterSelectMode(); }
  function onBulkFav(){
    if (!selectedIds.size) return;
    const movies = readMovies();
    movies.forEach(m => { if (selectedIds.has(m.id)) m.favorite = true; });
    writeMovies(movies);
  }
  function onBulkUnfav(){
    if (!selectedIds.size) return;
    const movies = readMovies();
    movies.forEach(m => { if (selectedIds.has(m.id)) m.favorite = false; });
    writeMovies(movies);
  }
  function onBulkDelete(){
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} selected item(s)?`)) return;
    const keep = readMovies().filter(m => !selectedIds.has(m.id));
    writeMovies(keep);
    exitSelectMode();
  }
  function onBulkExit(){ exitSelectMode(); }

  // external events
  document.addEventListener('xsf:movie-added', renderAll);
  document.addEventListener('xsf:movies-updated', renderAll);

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    // tabs
    document.getElementById('tabAll')?.addEventListener('click', ()=>handleTabClick('all'));
    document.getElementById('tabRecent')?.addEventListener('click', ()=>handleTabClick('recent'));
    document.getElementById('tabFavs')?.addEventListener('click', ()=>handleTabClick('favorites'));
    document.getElementById('tabAll')?.addEventListener('keydown', onTabKeydown);
    document.getElementById('tabRecent')?.addEventListener('keydown', onTabKeydown);
    document.getElementById('tabFavs')?.addEventListener('keydown', onTabKeydown);

    // grid: click + change
    document.getElementById('vaultGrid')?.addEventListener('click', onGridClick);
    document.getElementById('vaultGrid')?.addEventListener('change', onGridChange);

    // reset
    document.getElementById('resetDemo')?.addEventListener('click', onResetDemo);

    // search
    document.getElementById('vaultSearch')?.addEventListener('input', onSearchInput);
    document.getElementById('vaultSearch')?.addEventListener('keydown', onSearchKeydown);
    document.getElementById('clearSearch')?.addEventListener('click', onSearchClear);

    // sort
    document.getElementById('vaultSort')?.addEventListener('change', onSortChange);

    // bulk
    document.getElementById('bulkToggle')?.addEventListener('click', onBulkToggle);
    document.getElementById('bulkFav')?.addEventListener('click', onBulkFav);
    document.getElementById('bulkUnfav')?.addEventListener('click', onBulkUnfav);
    document.getElementById('bulkDelete')?.addEventListener('click', onBulkDelete);
    document.getElementById('bulkExit')?.addEventListener('click', onBulkExit);

    // Esc exits select mode
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape' && selectMode) exitSelectMode(); });

    // edit modal
    document.getElementById('editSave')?.addEventListener('click', onEditSave);
    document.getElementById('editCancel')?.addEventListener('click', closeEditModal);
    document.getElementById('editClose')?.addEventListener('click', closeEditModal);
    document.getElementById('editPosterUrl')?.addEventListener('input', onEditPosterInput);
    document.getElementById('editModal')?.addEventListener('click', (e)=>{
      if (e.target === e.currentTarget.firstElementChild) closeEditModal(); // backdrop
    });

    renderAll();
  });

  // QA helpers
  window.xsf = Object.freeze({
    getMovies: () => readMovies(),
    addMovie: (title, posterUrl='') => {
      const movies = readMovies();
      movies.push(normalizeMovie({ title, posterUrl, favorite:false, addedAt: nowTs() }));
      writeMovies(movies);
    },
    clear: () => onResetDemo(),
    setTab: (t) => { writeTab(t); renderAll(); },
    setSearch: (q='') => { writeSearch(q); renderAll(); },
    setSort: (s='title-az') => { writeSort(s); renderAll(); },
  });
})();
