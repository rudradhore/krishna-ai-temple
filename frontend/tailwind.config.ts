import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          white: "#FAFAF7",      // The primary background (Warm paper)
          gold: "#C9A44C",       // Divine accents (Muted)
          charcoal: "#2E2E2E",   // Text (Softer than black)
          stone: "#E5E5E0",      // Borders/Separators
          mist: "#F2F0E9",       // Secondary backgrounds
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"], // For Divine voice
        sans: ["var(--font-inter)", "sans-serif"], // For User voice
      },
      animation: {
        "breathe": "breathe 6s ease-in-out infinite",
        "fade-in": "fadeIn 2s ease-out forwards",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.4", transform: "scale(0.98)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        }
      },
    },
  },
  plugins: [],
};
export default config;