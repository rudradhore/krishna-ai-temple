/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          white: "#FDFBF7",      // Brighter Cream for Light Mode
          gold: "#B8860B",       // Darker Gold for better visibility
          charcoal: "#1A1A1A",   // Near-black for sharp text
          stone: "#EBEBE6",      // Visible button background (Light)
          mist: "#F2F0E9",       // Message bubble (Light)
          
          // 🌑 DARK MODE (High Contrast)
          midnight: "#0F0F0F",   // True Black background
          obsidian: "#1F1F1F",   // Visible button background (Dark)
          starlight: "#F0F0F0",  // Bright White text
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"], 
        sans: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 60s linear infinite",
        "breathe": "breathe 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};