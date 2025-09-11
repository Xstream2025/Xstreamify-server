// Helper: ensure vault grid exists
function getVaultGrid() {
  let grid = document.querySelector('#vault-grid');
  if (grid) return grid;

  const anchor = document.querySelector('#vault-anchor') || document.querySelector('#vault h2');
  const newGrid = document.createElement('div');
  newGrid.id = 'vault-grid';
  newGrid.className = 'mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(newGrid, anchor.nextSibling);
  } else {
    (document.querySelector('#vault') || document.body).appendChild(newGrid);
  }
  return newGrid;
}

// Render cards into the vault
function renderVaultCards(items) {
  const grid = getVaultGrid();
  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'xsm-card rounded-xl overflow-hidden bg-[#121212]';
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

// Test render (you can remove later)
document.addEventListener('DOMContentLoaded', () => {
  renderVaultCards([
    { title: 'Braveheart', poster: 'https://image.tmdb.org/t/p/w342/hs7htLqV9FJZQhY2vWcF4sJ5v7K.jpg' },
    { title: 'The Matrix', poster: 'https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg' },
    { title: 'Blade Runner', poster: 'https://image.tmdb.org/t/p/w342/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg' }
  ]);
});
