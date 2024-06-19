/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      sora: ["Sora", "sans-serif"],
      "sora-sb": ["Sora-SemiBold", "sans-serif"],
      "sora-medium": ["Sora-Medium", "sans-serif"],
    },
    extend: {},

    plugins: [],
  },
};
