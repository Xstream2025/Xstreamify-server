(() => {
  // ===== Keys =====
  const LS_MOVIES = 'xsf_movies_v1';
  const LS_TAB    = 'xsf_tab_v1';
  const LS_SEARCH = 'xsf_search_v1';
  const LS_SORT   = 'xsf_sort_v1';

  // ===== State =====
  /** @type {{id:string,title:string,posterUrl:string,favorite:boolean,addedAt:number}[]} */
  let movies = loadMovies();
  let activeTab = loadStr(LS_TAB) || 'all';       // 'all' | 'recent' | 'favs'
  let searchVal = loadStr(LS_SEARCH) || '';
  let sortVal   = loadStr(LS_SORT) || 'az';

  // If totally empty, seed two so you immediately see cards
  if (!movies.length) {
    movies = [
      m('Test Movie 1', './img/placeholder-2x3.png'),
      m('Test Movie 2', './img/placeholder-2x3.png'),
    ];
    saveMovies(movies);
  }

  // ===== DOM =====
  const el = (id) => document.getElementById(id);
  const grid        = el('grid');
  const emptyState  = el('emptyState');

  const searchInput = el('search');
  const tabAll      = el('tabAll');
  const tabRecent   = el('tabRecent');
  const tabFavs     = el('tabFavs');
  const sortSel     = el('sort');
  const btnImport   = el('btnImport');
  const btnExport   = el('btnExport');
  const btnAdd      = el('btnAdd');

  const bulkBar   = el('bulkBar');
  const bulkFav   = el('bulkFav');
  const bulkUnfav = el('bulkUnfav');
  const bulkDel   = el('bulkDel');

  // Modal
  const modal       = el('modal');
  const modalTitle  = el('modalTitle');
  const mTitle      = el('mTitle');
  const mPoster     = el('mPoster');
  const modalCancel = el('modalCancel');
  const modalSave   = el('modalSave');

  let editingId = null;  // null = adding

  // ===== Init Controls =====
  searchInput.value = searchVal;
  sortSel.value = sortVal;
  syncTabsUI();

  searchInput.addEventListener('input', () => {
    searchVal = searchInput.value.trim();
    saveStr(LS_SEARCH, searchVal);
    render();
  });

  tabAll.addEventListener('click', () => { activeTab = 'all';    saveStr(LS_TAB, activeTab); syncTabsUI(); render(); });
  tabRecent.addEventListener('click', () => { activeTab = 'recent'; saveStr(LS_TAB, activeTab); syncTabsUI(); render(); });
  tabFavs.addEventListener('click', () => { activeTab = 'favs';   saveStr(LS_TAB, activeTab); syncTabsUI(); render(); });

  sortSel.addEventListener('change', () => {
    sortVal = sortSel.value;
    saveStr(LS_SORT, sortVal);
    render();
  });

  btnAdd.addEventListener('click', () => {
    editingId = null;
    modalTitle.textContent = 'Add Movie';
    mTitle.value = '';
    mPoster.value = './img/placeholder-2x3.png';
    showModal(true);
  });

  btnExport.addEventListener('click', () => {
    const data = JSON.stringify(movies, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a');
    const ts = fmtTimestamp(new Date());
    a.href = URL.createObjectURL(blob);
    a.download = `xstreamify-movies-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  btnImport.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) throw new Error('JSON is not an array');

        let map = new Map(movies.map(x => [x.id, x]));
        for (const it of arr) {
          const n = normalize(it);
          if (!n) continue;
          // dedupe by id; else by lower-title
          let replaced = false;
          if (n.id && map.has(n.id)) { map.set(n.id, n); replaced = true; }
          if (!replaced) {
            const byTitleKey = keyByTitle(n.title);
            const exist = [...map.values()].find(v => keyByTitle(v.title) === byTitleKey);
            if (exist) map.set(exist.id, {...n, id: exist.id});
            else map.set(n.id, n);
          }
        }
        movies = [...map.values()];
        saveMovies(movies);
        alert('Import complete.');
        render();
      } catch (e) {
        console.error(e);
        alert('Import failed: ' + (e && e.message ? e.message : e));
      }
    };
    input.click();
  });

  modalCancel.addEventListener('click', () => showModal(false));
  modalSave.addEventListener('click', () => {
    const title = mTitle.value.trim();
    const posterUrl = mPoster.value.trim() || './img/placeholder-2x3.png';
    if (!title) { alert('Title is required'); return; }

    if (editingId) {
      movies = movies.map(it => it.id === editingId ? {...it, title, posterUrl} : it);
    } else {
      movies = [...movies, m(title, posterUrl)];
    }
    saveMovies(movies);
    showModal(false);
    render();
  });

  bulkFav.addEventListener('click',   () => bulkMark(true));
  bulkUnfav.addEventListener('click', () => bulkMark(false));
  bulkDel.addEventListener('click',   () => bulkDelete());

  // ===== Render =====
  render();

  function render() {
    const filtered = movies
      .filter(byTab)
      .filter(it => it.title.toLowerCase().includes(searchVal.toLowerCase()));

    filtered.sort(sorter(sortVal));

    grid.innerHTML = '';
    if (!filtered.length) {
      emptyState.classList.remove('hidden');
      bulkBar.classList.add('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    for (const it of filtered) {
      const card = document.createElement('div');
      card.className = 'card relative bg-neutral-900 rounded p-2';

      card.innerHTML = `
        <img src="${escapeHtml(it.posterUrl)}" alt="Poster" onerror="this.src='./img/placeholder-2x3.png'"/>
        <div class="p-2 text-sm">${escapeHtml(it.title)}</div>
        <button class="delete-btn absolute top-1 left-1 bg-red-600 px-2 rounded" title="Delete">✕</button>
        <button class="fav-btn absolute top-1 right-1 bg-red-600 px-2 rounded" title="Favorite">${it.favorite ? '♥' : '♡'}</button>
        <button class="edit-btn absolute bottom-1 right-1 bg-red-600 px-2 rounded" title="Edit">✎</button>
        <input class="sel-box absolute bottom-1 left-1 w-4 h-4" type="checkbox"/>
      `;

      // controls
      card.querySelector('.delete-btn').addEventListener('click', () => {
        if (!confirm('Delete this movie?')) return;
        movies = movies.filter(x => x.id !== it.id);
        saveMovies(movies);
        render();
      });

      card.querySelector('.fav-btn').addEventListener('click', (ev) => {
        movies = movies.map(x => x.id === it.id ? {...x, favorite: !x.favorite} : x);
        saveMovies(movies);
        (ev.currentTarget).textContent = (it.favorite ? '♡' : '♥');
        render();
      });

      card.querySelector('.edit-btn').addEventListener('click', () => {
        editingId = it.id;
        modalTitle.textContent = 'Edit Movie';
        mTitle.value = it.title;
        mPoster.value = it.posterUrl || './img/placeholder-2x3.png';
        showModal(true);
      });

      card.querySelector('.sel-box').addEventListener('change', updateBulkBar);

      grid.appendChild(card);
    }

    updateBulkBar();
  }

  function updateBulkBar() {
    const anyChecked = grid.querySelectorAll('.sel-box:checked').length > 0;
    if (anyChecked) bulkBar.classList.remove('hidden');
    else bulkBar.classList.add('hidden');
  }

  function bulkMark(val) {
    const ids = selectedIds();
    if (!ids.length) return;
    movies = movies.map(x => ids.includes(x.id) ? {...x, favorite: val} : x);
    saveMovies(movies);
    render();
  }

  function bulkDelete() {
    const ids = selectedIds();
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} selected?`)) return;
    movies = movies.filter(x => !ids.includes(x.id));
    saveMovies(movies);
    render();
  }

  function selectedIds() {
    const ids = [];
    const cards = grid.querySelectorAll('.card');
    cards.forEach((card, idx) => {
      const cb = card.querySelector('.sel-box');
      if (cb.checked) {
        // find filtered item at same render index
        const rendered = movies.filter(byTab)
          .filter(it => it.title.toLowerCase().includes(searchVal.toLowerCase()))
          .sort(sorter(sortVal));
        if (rendered[idx]) ids.push(rendered[idx].id);
      }
    });
    return ids;
  }

  // ===== Helpers =====
  function byTab(it) {
    if (activeTab === 'favs')   return it.favorite;
    if (activeTab === 'recent') {
      // last 7 days considered "recent"
      const weekAgo = Date.now() - 7*24*60*60*1000;
      return it.addedAt >= weekAgo;
    }
    return true;
  }

  function sorter(s) {
    if (s === 'za')  return (a,b) => cmp(b.title, a.title);
    if (s === 'fav') return (a,b) => (b.favorite - a.favorite) || cmp(a.title,b.title);
    return (a,b) => cmp(a.title, b.title); // az
  }

  function cmp(a,b) { return a.toLowerCase().localeCompare(b.toLowerCase(), undefined, {sensitivity:'base'}); }

  function m(title, posterUrl) {
    return {
      id: genId(),
      title,
      posterUrl,
      favorite: false,
      addedAt: Date.now()
    };
  }

  function genId() {
    return 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }

  function saveMovies(arr) { localStorage.setItem(LS_MOVIES, JSON.stringify(arr)); }
  function loadMovies()    {
    try { return JSON.parse(localStorage.getItem(LS_MOVIES)) || []; }
    catch { return []; }
  }
  function saveStr(k,v){ localStorage.setItem(k, v); }
  function loadStr(k){ return localStorage.getItem(k); }

  function showModal(show) {
    if (show) modal.classList.remove('hidden');
    else      modal.classList.add('hidden');
  }

  function keyByTitle(t){ return (t||'').trim().toLowerCase(); }

  function normalize(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const title = (obj.title || '').toString().trim();
    if (!title) return null;
    return {
      id: (obj.id && obj.id.toString()) || genId(),
      title,
      posterUrl: (obj.posterUrl || './img/placeholder-2x3.png').toString(),
      favorite: !!obj.favorite,
      addedAt: Number(obj.addedAt) || Date.now()
    };
  }

  function fmtTimestamp(d) {
    const pad = n => n.toString().padStart(2,'0');
    return d.getFullYear().toString()
      + pad(d.getMonth()+1) + pad(d.getDate())
      + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }

  function escapeHtml(s=''){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function syncTabsUI() {
    const on = el => { el.classList.add('bg-red-600'); el.classList.remove('bg-neutral-800'); };
    const off = el => { el.classList.remove('bg-red-600'); el.classList.add('bg-neutral-800'); };
    if (activeTab === 'all')    { on(tabAll);    off(tabRecent); off(tabFavs); }
    if (activeTab === 'recent') { on(tabRecent); off(tabAll);   off(tabFavs); }
    if (activeTab === 'favs')   { on(tabFavs);   off(tabAll);   off(tabRecent); }
  }
})();
