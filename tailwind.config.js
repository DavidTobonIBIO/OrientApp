/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        spaceMono: ["SpaceMono-regular", "sans-serif"]
      },
      colors: {
        "dark-blue": "#242E47",
        "light-gray": "#DADACE",
        "black": "#000000",
        "white": "#FFFFFF",
        "danger": "#F75555"
      }
    },
  },
  plugins: [],
}