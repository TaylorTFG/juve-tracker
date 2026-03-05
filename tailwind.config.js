/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        juventus: {
          black: "#111111",
          gray: "#f5f5f5",
          accent: "#c1ff72"
        }
      }
    }
  },
  plugins: []
};
