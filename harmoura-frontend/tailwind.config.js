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
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}