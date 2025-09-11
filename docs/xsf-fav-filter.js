/* X-Streamify – Favorites filter (stable)
   - Clicking a “Favorites” link/button hides non-favorited tiles
   - Clicking an “All” link/button restores everything
   - Pure JS; no layout changes
*/
console.log("xsf-fav-filter.js loaded");

(function () {
  function showOnlyFavorites() {
    document.querySelectorAll(".tile").forEach((tile) => {
      tile.style.display = tile.classList.contains("favorited") ? "" : "none";
    });
  }
  function showAll() {
    document.querySelectorAll(".tile").forEach((tile) => (tile.style.display = ""));
  }

  // Find “Favorites” triggers by text
  const favTriggers = Array.from(document.querySelectorAll("a,button"))
    .filter((el) => /favorites/i.test(el.textContent.trim()));

  // Find “All” triggers by text
  const allTriggers = Array.from(document.querySelectorAll("a,button"))
    .filter((el) => /^\s*all\s*$/i.test(el.textContent));

  favTriggers.forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault?.();
      showOnlyFavorites();
    })
  );
  allTriggers.forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault?.();
      showAll();
    })
  );
})();
