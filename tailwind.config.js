/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        card: '#111827',
        border: '#1f293d',
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          glow: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bengali: ['Kalpurush', 'Hind Siliguri', 'Noto Sans Bengali', 'sans-serif'],
        surah: ['surah-name-v1', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
