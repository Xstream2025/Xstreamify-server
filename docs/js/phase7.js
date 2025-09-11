/* Phase 7 JS — keeps your visuals and adds a robust Vault renderer
   that pins cards directly under the "Your Vault" heading without
   changing your HTML/CSS structure.  */

// -------- Vault helpers --------

// Locate the vault grid that sits under the “Your Vault” area.
function findVaultGrid() {
  // 1) If you already have an explicit id
  const byId = document.querySelector('#vault-grid');
  if (byId) return byId;

  // 2) If there is a section#vault, use its first grid
  const vaultSection = document.querySelector('#vault');
  if (vaultSection) {
    const gridInSection = vaultSection.querySelector('.grid');
    if (gridInSection) return gridInSection;
  }

  // 3) Find the H2 that says "Your Vault", then the next .grid following it
  const h2s = Array.from(document.querySelectorAll('h2'));
  const vaultH2 = h2s.find(h => h.textContent.trim().toLowerCase() === 'your vault');
  if (vaultH2) {
    // Try siblings under the same section/container
    let container = vaultH2.parentElement;
    // search in the parent block and its next sibling if needed
    const tryFind = (root) => root ? root.querySelector('.grid') : null;
    let grid = tryFind(container.parentElement) || tryFind(container.nextElementSibling) || tryFind(container);
    if (grid) return grid;
  }

  // 4) Absolute fallback so we never append to the document end
  return document.querySelector('.grid') || document.body;
}

// Render cards into the detected grid
function renderVaultCards(items) {
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
}

// -------- App boot (leave existing app code below this) --------
document.addEventListener('DOMContentLoaded', () => {
  // (Optional) quick smoke test — comment this out if you don’t want sample tiles
  // renderVaultCards([
  //   { title: 'Braveheart',   poster: 'https://image.tmdb.org/t/p/w342/hs7htLqV9FJZQhY2vWcF4sJ5v7K.jpg' },
  //   { title: 'The Matrix',   poster: 'https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' },
  //   { title: 'Blade Runner', poster: 'https://image.tmdb.org/t/p/w342/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg' }
  // ]);
});
