// packages/frontend/<app>/next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@leadspark/ui', '@leadspark/common'],
  experimental: { esmExternals: 'loose' },
};
