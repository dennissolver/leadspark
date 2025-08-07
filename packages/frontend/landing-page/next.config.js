const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  sassOptions: {
    includePaths: [
      path.join(__dirname, '../../../styles'), // shared styles
      path.join(__dirname, 'styles'),          // app-local styles
      path.join(__dirname, 'node_modules'),    // node modules (optional)
    ],
    // ✅ Remove prependData — using explicit import in _app.tsx instead
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

