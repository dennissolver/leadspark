// packages/frontend/landing-page/next.config.js
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  // SCSS configuration
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'styles'),
      path.join(__dirname, '../../../styles'), // Shared styles path
    ],
    prependData: `@import "variables";`, // Auto-import variables
  },

  // Webpack configuration for monorepo
  experimental: {
    externalDir: true, // Allow imports from outside the app directory
  },

  // Transpile workspace packages if needed
  transpilePackages: [],

  // NEW: API rewrites for local development
  // This is crucial for proxying API calls to the backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
}

module.exports = nextConfig;
