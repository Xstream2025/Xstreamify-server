/* Phase 8 – Step 2: Modal + Validation (Title & Year required; Poster optional) */

(() => {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

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

  // Open / Close
  function openModal() {
    lastFocus = document.activeElement;
    backdrop.classList.add('xsm-open');
    modal.classList.add('xsm-open');
    // Reset state
    form.reset();
    [errTitle, errYear, errPoster].forEach(e => e.textContent = '');
    saveBtn.disabled = true;
    // Focus first field
    setTimeout(() => inputTitle.focus(), 0);
    // Trap focus
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

  // Validation
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
    if (!v) { errPoster.textContent = ''; return true; } // optional
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
    const ok = validateTitle() & validateYear() & validatePoster();
    saveBtn.disabled = !ok;
  }

  // Events
  openBtn?.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', (e) => { e.preventDefault(); closeModal(); });

  backdrop?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    // clicks outside card area close (backdrop already handles), ignore inside
    // no-op
  });

  // Live validation
  [inputTitle, inputYear, inputPoster].forEach(inp => {
    inp.addEventListener('input', updateSaveState);
    inp.addEventListener('blur', updateSaveState);
  });

  // Prevent submit for Step 2 (save comes in Step 3)
  saveBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    updateSaveState();
    // If we reach here with enabled button, we’ll wire save in Step 3.
  });

  // Keyboard: ESC closes, Enter attempts save, Tab trap
  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
      // Let validation run; Step 3 will create
      e.preventDefault();
      updateSaveState();
    }
  }

  // Focus trap
  function trapFocus(e) {
    if (!modal.classList.contains('xsm-open')) return;
    if (!modal.contains(e.target)) {
      e.stopPropagation();
      inputTitle.focus();
    }
  }
})();
