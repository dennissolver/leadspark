// packages/frontend/portal/next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [
      path.join(__dirname, '../../../styles'),
      path.join(__dirname, 'styles'),
      path.join(__dirname, 'node_modules'),
    ],
    // ⛔ Remove prependData
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
