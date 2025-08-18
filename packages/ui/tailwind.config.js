/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx}",
    "../../frontend/portal/pages/**/*.{ts,tsx}",
    "../../frontend/landing-page/pages/**/*.{ts,tsx}",
    // Add other frontend paths as needed
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0070f3", // Customize to your brand
        secondary: "#ff4081",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};