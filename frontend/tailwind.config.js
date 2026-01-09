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
          white: "#F4F1EA",      // ☁️ NEW: Warm Limestone (Not stark white)
          gold: "#B8860B",       // Antique Gold
          charcoal: "#2C2C2C",   // Softer Black
          stone: "#E6E2D6",      // Darker Beige for buttons
          mist: "#EBE8E0",       // Message bubbles
          
          // 🌑 DARK MODE
          midnight: "#141414",   // Soft Black
          obsidian: "#1F1F1F",   // Dark Gray
          starlight: "#EAEAEA",  // Soft White text
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"], 
        sans: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "spin-slow": "spin 60s linear infinite",
        "breathe": "breathe 4s ease-in-out infinite", // Faster breath for responsiveness
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.5", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        }
      },
    },
  },
  plugins: [],
};