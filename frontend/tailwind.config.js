/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 🌙 THIS ENABLES THE TOGGLE
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          white: "#FAFAF7",      // Light Mode Background (Cream)
          gold: "#C9A44C",       // Accents
          charcoal: "#2E2E2E",   // Light Mode Text
          stone: "#E5E5E0",      // Light Mode Borders
          mist: "#F2F0E9",       // Light Mode Bubbles
          
          // 🌑 DARK MODE COLORS
          midnight: "#121212",   // Deepest background
          obsidian: "#1E1E1E",   // Secondary background
          starlight: "#EAEAEA",  // Dark Mode Text
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
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.98)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        }
      },
    },
  },
  plugins: [],
};