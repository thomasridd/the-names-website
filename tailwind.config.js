/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,njk,md}",
    "./.eleventy.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066cc',
        secondary: '#666',
      },
    },
  },
  plugins: [],
}
