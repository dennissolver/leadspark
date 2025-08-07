// packages/frontend/portal/next.config.js
// next.config.js
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  sassOptions: {
    includePaths: [
      path.resolve(__dirname, '../../styles'), // Resolves to packages/styles
    ],
  },

  experimental: {
    externalDir: true, // for monorepo support
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
