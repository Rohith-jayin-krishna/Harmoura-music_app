/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appleGray: "#f5f5f7",
        appleDark: "#1d1d1f",
        applePink: "#ff2d55",

        // ✅ Added new ones, without altering existing
        brand: "#f9243d",       
        sidebar: {
          bg: "#ffffff",
          hover: "#f0f0f0",
          active: "#fdecee",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.06)",
        smooth: "0 2px 8px rgba(0,0,0,0.08)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
}