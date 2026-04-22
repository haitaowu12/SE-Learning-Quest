/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'se-primary': '#0ea5e9',
        'se-secondary': '#6366f1',
        'se-accent': '#f59e0b',
        'se-dark': '#0f172a',
        'se-light': '#f8fafc',
      },
    },
  },
  plugins: [],
};
