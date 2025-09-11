// Phase 8 — Step 5 helper: Pin the Vault grid under the "Your Vault" heading
// Non-destructive: no CSS/HTML build required.

// Find the correct grid that belongs to the Vault section
function findVaultGrid() {
  // Prefer explicit id if present
  const byId = document.querySelector('#vault-grid');
  if (byId) return byId;

  // Look inside the section#vault
  const section = document.querySelector('#vault');
  if (section) {
    const inSection = section.querySelector('.grid');
    if (inSection) return inSection;
  }

  // Fallback: find the H2 text and then the nearest grid after it
  const h2 = [...document.querySelectorAll('h2')]
    .find(h => h.textContent.trim().toLowerCase() === 'your vault');
  if (h2) {
    // search the container and its next sibling for a .grid
    const root = h2.parentElement;
    const tryFind = (node) => (node ? node.querySelector('.grid') : null);
    return tryFind(root) || tryFind(root.nextElementSibling) || tryFind(root.parentElement);
  }

  // Absolute fallback (prevents appending to end of body)
  return document.querySelector('.grid') || document.body;
}

// Public API: call this to render cards into the Vault grid
window.renderVaultCards = function(items) {
  const grid = findVaultGrid();
  if (!grid) return;

  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'xsm-card rounded-2xl overflow-hidden bg-[#121212]';
    card.innerHTML = `
      <div class="aspect-[2/3] bg-black/40">
        <img src="${item.poster}" alt="${item.title}" class="w-full h-full object-cover">
      </div>
      <div class="p-2">
        <p class="text-white text-sm truncate">${item.title}</p>
      </div>
    `;
    grid.appendChild(card);
  });
};
