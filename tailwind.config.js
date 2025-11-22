/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",             // Files in root (App.tsx, index.tsx)
    "./components/**/*.{js,ts,jsx,tsx}", // Files in components folder
    "./src/**/*.{js,ts,jsx,tsx}"       // Keep src just in case
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}