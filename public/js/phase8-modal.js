/* Phase 8 – Modal + Validation + Create & Render (robust) */

(() => {
  const qs = (s, r = document) => r.querySelector(s);

  // Elements
  const openBtn   = qs('#add-movie-btn');
  const modal     = qs('#xsm-modal');
  const backdrop  = qs('#xsm-modal-backdrop');
  const closeBtn  = qs('#xsm-close');
  const cancelBtn = qs('#xsm-cancel');
  const saveBtn   = qs('#xsm-save');
  const form      = qs('#xsm-form');

  const inputTitle  = qs('#xsm-title');
  const inputYear   = qs('#xsm-year');
  const inputPoster = qs('#xsm-poster');

  const errTitle  = qs('#xsm-title-err');
  const errYear   = qs('#xsm-year-err');
  const errPoster = qs('#xsm-poster-err');

  let lastFocus = null;

  /* -------- Open / Close -------- */
  function openModal() {
    lastFocus = document.activeElement;
    backdrop.classList.add('xsm-open');
    modal.classList.add('xsm-open');
    form.reset();
    errTitle.textContent = errYear.textContent = errPoster.textContent = '';
    saveBtn.disabled = true;
    setTimeout(() => inputTitle.focus(), 0);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('focus', trapFocus, true);
  }

  function closeModal() {
    backdrop.classList.remove('xsm-open');
    modal.classList.remove('xsm-open');
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focus', trapFocus, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* -------- Validation -------- */
  const yearRE = /^(19\d{2}|20\d{2})$/; // 1900–2099

  function validateTitle() {
    const v = inputTitle.value.trim();
    if (!v) { errTitle.textContent = 'Title is required.'; return false; }
    if (v.length > 120) { errTitle.textContent = 'Keep it under 120 chars.'; return false; }
    errTitle.textContent = ''; return true;
  }

  function validateYear() {
    const v = inputYear.value.trim();
    if (!v) { errYear.textContent = 'Year is required.'; return false; }
    if (!yearRE.test(v)) { errYear.textContent = 'Enter a 4-digit year (1900–2099).'; return false; }
    errYear.textContent = ''; return true;
  }

  function validatePoster() {
    const v = inputPoster.value.trim();
    if (!v) { errPoster.textContent = ''; return true; }
    try {
      const u = new URL(v);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
      errPoster.textContent = ''; return true;
    } catch {
      errPoster.textContent = 'Enter a valid http(s) URL or leave blank.';
      return false;
    }
  }

  function updateSaveState() {
    const ok = Boolean(validateTitle() & validateYear() & validatePoster());
    saveBtn.disabled = !ok;
    return ok;
  }

  /* -------- Persist helpers -------- */
  const LS_KEY = 'xstreamify:movies';

  function loadStoredMovies() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function saveStoredMovies(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list || [])); }
    catch { /* ignore */ }
  }

  function upsertInto(arr, movie) {
    const idx = arr.findIndex(m => m.id === movie.id);
    if (idx >= 0) arr.splice(idx, 1);
    arr.unshift(movie);
  }

  /* -------- Create & Render -------- */
  function onSave(e) {
    e.preventDefault();
    if (!updateSaveState()) return;

    const title = inputTitle.value.trim();
    const year  = parseInt(inputYear.value.trim(), 10);
    const poster = inputPoster.value.trim();

    const id = `${title.toLowerCase().replace(/\s+/g,'-')}-${year}`;
    const movie = {
      id,
      title,
      year,
      poster: poster || '',
      createdAt: Date.now(),
      favorite: false
    };

    // Ensure global array exists
    if (!Array.isArray(window.movies)) window.movies = [];

    // Update in-memory list
    upsertInto(window.movies, movie);

    // Update localStorage
    const stored = loadStoredMovies();
    upsertInto(stored, movie);
    saveStoredMovies(stored);

    // Force immediate UI refresh (whichever exists)
    if (typeof window.applyFilters === 'function') {
      try { window.applyFilters(); } catch {}
    } else if (typeof window.renderMovies === 'function') {
      try { window.renderMovies(); } catch {}
    }

    closeModal();
  }

  /* -------- Events -------- */
  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });
  backdrop?.addEventListener('click', closeModal);

  [inputTitle, inputYear, inputPoster].forEach(inp => {
    inp.addEventListener('input', updateSaveState);
    inp.addEventListener('blur', updateSaveState);
  });

  saveBtn?.addEventListener('click', onSave);

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (updateSaveState()) onSave(e);
    }
  }

  function trapFocus(e) {
    if (!modal.classList.contains('xsm-open')) return;
    if (!modal.contains(e.target)) {
      e.stopPropagation();
      inputTitle.focus();
    }
  }
})();
