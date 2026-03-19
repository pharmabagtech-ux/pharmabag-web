/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@pharmabag/ui', '@pharmabag/api-client', '@pharmabag/utils', 'framer-motion'],
  reactStrictMode: true,
};

module.exports = nextConfig;
