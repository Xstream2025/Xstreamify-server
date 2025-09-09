// Mobile menu toggle (defensive)
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  // Simple "Vault" tab handler (future-proof)
  const tabs = document.querySelectorAll('.vault-tab');
  const panes = {
    movies: document.getElementById('pane-movies'),
    docs:   document.getElementById('pane-docs'),
    pics:   document.getElementById('pane-pics'),
  };
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const key = t.getAttribute('data-tab');
      // toggle aria-selected state
      tabs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
      // show/hide panes
      Object.entries(panes).forEach(([k, el]) => {
        if (!el) return;
        if (k === key) el.classList.remove('hidden');
        else el.classList.add('hidden');
      });
    });
  });
});
