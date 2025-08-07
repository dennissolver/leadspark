// packages/frontend/landing-page/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // SCSS setup for shared styling
  sassOptions: {
    includePaths: [
      path.join(__dirname, '../../../styles'), // shared styles
      path.join(__dirname, 'styles'),          // app-local styles
      path.join(__dirname, 'node_modules'),    // node modules (optional but safe)
    ],
    prependData: `@import "main.scss";`, // injects shared styles globally
  },

  // Enables imports outside this app (monorepo support)
  experimental: {
    externalDir: true,
  },

  // Rewrites for local development to backend API
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*", // local FastAPI backend
      },
    ];
  },
};

module.exports = nextConfig;
