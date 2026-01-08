/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          white: "#FAFAF7",
          gold: "#C9A44C",
          charcoal: "#2E2E2E",
          stone: "#E5E5E0",
          mist: "#F2F0E9",
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