// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all JS/TS files in src folder
    "./public/index.html", // Also include public HTML if needed
  ],
  theme: {
    extend: {}, // Optional: Add custom themes or extend Tailwind defaults
  },
  plugins: [], // Optional: Add Tailwind plugins here if needed
};
