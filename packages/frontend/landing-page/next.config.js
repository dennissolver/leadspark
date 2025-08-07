// next.config.js
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  // SCSS configuration
  sassOptions: {
    includePaths: [path.join(__dirname, '../../../styles')],
    prependData: `@use "variables"; @use "mixins";`, // Auto-import variables and mixins
  },

  // Webpack configuration for monorepo
  experimental: {
    externalDir: true, // Allow imports from outside the app directory
  },

  // Transpile workspace packages if needed
  transpilePackages: [],
}

module.exports = nextConfig

