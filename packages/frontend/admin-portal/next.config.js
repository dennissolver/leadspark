// packages/frontend/admin-portal/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  sassOptions: {
    includePaths: [
      path.join(__dirname, '../../../styles'), // shared styles
      path.join(__dirname, 'styles'),          // local styles
      path.join(__dirname, 'node_modules'),    // dependencies
    ],
    // ✅ Removed prependData to avoid conflicts
  },

  experimental: {
    externalDir: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
