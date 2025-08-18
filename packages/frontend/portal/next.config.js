/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true, // you can set false while debugging double-mounts
  transpilePackages: ['@leadspark/ui', '@leadspark/common'],
  experimental: { esmExternals: 'loose' },
};
