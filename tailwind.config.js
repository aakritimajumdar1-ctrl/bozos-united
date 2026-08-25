/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF5EC",
        card: "#FFFFFF",
        ink: "#2A2130",
        inksoft: "#6B6070",
        line: "#E9E0D2",
        gold: "#C79A46",
        navy: "#1B3A5C",
        maroon: "#7A1F2B",
        indian: {
          DEFAULT: "#9C3B4C",
          soft: "#FAEEDA",
          deep: "#4A1B0C",
          text: "#712B13",
          accent: "#993C1D",
        },
        american: { DEFAULT: "#185FA5", soft: "#E6F1FB", text: "#0C447C" },
        court: { DEFAULT: "#534AB7", soft: "#EEEDFE", text: "#3C3489" },
        bachelor: { DEFAULT: "#993556", soft: "#FBEAF0", text: "#72243E" },
        honeymoon: { DEFAULT: "#0F6E56", soft: "#E1F5EE", text: "#085041" },
        prep: { DEFAULT: "#854F0B", soft: "#FAEEDA", text: "#633806" },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Work Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
