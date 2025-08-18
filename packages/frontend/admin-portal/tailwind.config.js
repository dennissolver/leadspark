
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",                        // <â€” add
    "../../frontend/admin-portal/pages/**/*.{ts,tsx}", // <â€” add if this file lives in a shared pkg
    "../../frontend/portal/pages/**/*.{ts,tsx}",
    "../../frontend/landing-page/pages/**/*.{ts,tsx}",
  ],
  theme: { extend: { /* ... */ } },
  plugins: [require("tailwindcss-animate")],
};


