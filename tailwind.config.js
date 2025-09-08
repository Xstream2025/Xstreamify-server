// tailwind.config.js
module.exports = {
  content: [
    "./public/**/*.html",
    "./routes/**/*.js",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#E50914",   // Netflix red
          dark: "#141414",      // Deep black background
          light: "#e5e5e5",     // Light text
          muted: "#a3a3a3"      // Subtle gray
        }
      }
    }
  },
  plugins: [],
};
