// next.config.js
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
    // Corrected: Use both @use and @import for variables and mixins
    prependData: `@use "variables" as *; @use "mixins" as *; @import "variables"; @import "mixins";`,
  },

  // Webpack configuration for monorepo
  experimental: {
    externalDir: true, // Allow imports from outside the app directory
  },

  // Transpile workspace packages if needed
  transpilePackages: [],
}

module.exports = nextConfig;


