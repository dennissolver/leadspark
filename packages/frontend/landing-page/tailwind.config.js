/** @type {import('tailwindcss').Config} */
const path = require('path');
const colors = require('tailwindcss/colors');
const posix = (p) => p.replace(/\\/g, '/');

const UI_ROOT = posix(path.resolve(__dirname, '../../ui'));
const COMMON_ROOT = posix(path.resolve(__dirname, '../../common'));

module.exports = {
  content: [
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',

    // if this app renders components from @leadspark/ui:
    `${UI_ROOT}/components/**/*.{ts,tsx,js,jsx}`,
    `${UI_ROOT}/index.{ts,tsx,js,jsx}`,
    `${UI_ROOT}/utils.{ts,tsx,js,jsx}`,

    // only include if the app imports from @leadspark/common:
    `${COMMON_ROOT}/src/**/*.{ts,tsx,js,jsx}`,

    // hard excludes
    `!${UI_ROOT}/node_modules/**`,
    `!${UI_ROOT}/dist/**`,
    `!${UI_ROOT}/.next/**`,
    `!${COMMON_ROOT}/node_modules/**`,
    `!${COMMON_ROOT}/dist/**`,
    `!${COMMON_ROOT}/.next/**`,
  ],
  theme: {
    extend: {
      colors: {
        // map your tokens used in JSX
        primary: colors.blue,
        success: colors.green,
        error: colors.red,
      },
      container: {
        center: true,
        padding: '1rem',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 15px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
