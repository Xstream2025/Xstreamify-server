/* Phase 7 — posters sized correctly + hearts */

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

  tile.innerHTML = `
    <div class="tile-card">
      <img class="poster" src="${poster}" alt="${movie.title}">
      <button class="heart-btn" aria-label="favorite"><span class="heart"></span></button>
    </div>
    <p class="tile-title">${movie.title} <span style="color:#9ca3af;font-size:.75rem">${movie.year}</span></p>
  `;

  grid.appendChild(tile);
});

// Hearts
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".heart-btn");
  if (!btn) return;
  const tile = btn.closest(".tile");
  const liked = tile.dataset.fav === "1";
  tile.dataset.fav = liked ? "0" : "1";
  btn.classList.toggle("is-liked", !liked);
});
