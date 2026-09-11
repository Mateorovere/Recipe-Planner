/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary — warm terracotta/coral. Drives CTAs, links, active nav, focus rings.
        brand: {
          50: "#fef6f2",
          100: "#fdeae1",
          200: "#fad2bd",
          300: "#f6b191",
          400: "#f18a60",
          500: "#e8683c",
          600: "#d84f24",
          700: "#b53d1a",
          800: "#92321a",
          900: "#772c19",
        },
        // Secondary — fresh green. "Have it" checks, match %, favorited state, success toasts.
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Warm neutral background/text scale, replacing flat cool grays.
        cream: {
          50: "#fdfbf8",
          100: "#faf5ef",
          200: "#f3e9dd",
          300: "#e8d8c4",
          400: "#d3bd9e",
          500: "#b79a76",
          600: "#96795a",
          700: "#786047",
          800: "#5b4835",
          900: "#3d3024",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgb(120 60 20 / 0.08), 0 1px 2px -1px rgb(120 60 20 / 0.06)",
        lifted: "0 16px 32px -12px rgb(120 60 20 / 0.22), 0 4px 10px -4px rgb(120 60 20 / 0.12)",
        glow: "0 0 0 4px rgb(232 104 60 / 0.12)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "heart-pop": {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.35)" },
          "60%": { transform: "scale(0.92)" },
          "100%": { transform: "scale(1)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgb(216 79 36 / 0.45)" },
          "100%": { boxShadow: "0 0 0 16px rgb(216 79 36 / 0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "heart-pop": "heart-pop 0.4s ease-out",
        "fade-in": "fade-in 0.25s ease-out both",
        "slide-up": "slide-up 0.3s ease-out both",
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
