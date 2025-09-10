/* Phase 7 — posters sized correctly + SVG hearts (top-right) */

const movies = [
  { title: "Spirited Away", year: 2001, poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg" },
  { title: "Interstellar", year: 2014, poster: "https://image.tmdb.org/t/p/w500/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg" },
  { title: "The Dark Knight", year: 2008, poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg" },
  { title: "Arrival", year: 2016, poster: "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg" },
  { title: "Whiplash", year: 2014, poster: "https://image.tmdb.org/t/p/w500/lIv1QinFqz4dlp5U4lQ6HaiskOZ.jpg" },
  { title: "Blade Runner 2049", year: 2017, poster: "https://image.tmdb.org/t/p/w500/aMpyrCizvS2tbO0F4ZqNLSKpYOi.jpg" }
];

const grid = document.getElementById("grid");

// Render
movies.forEach(movie => {
  const poster = movie.poster || "https://via.placeholder.com/500x750/111111/ffffff?text=Poster";

  const tile = document.createElement("article");
  tile.className = "tile";
  tile.dataset.fav = "0";

  const heartSVG = `
    <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`;

  tile.innerHTML = `
    <div class="tile-card">
      <img class="poster" src="${poster}" alt="${movie.title}"
           onerror="this.onerror=null;this.src='https://via.placeholder.com/500x750/111111/ffffff?text=Poster';">
      <button class="heart-btn" aria-label="favorite">${heartSVG}</button>
    </div>
    <p class="tile-title">${movie.title} <span style="color:#9ca3af;font-size:.75rem">${movie.year}</span></p>
  `;

  grid.appendChild(tile);
});

// Toggle hearts
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".heart-btn");
  if (!btn) return;
  const tile = btn.closest(".tile");
  const liked = tile.dataset.fav === "1";
  tile.dataset.fav = liked ? "0" : "1";
  btn.classList.toggle("is-liked", !liked);
});
