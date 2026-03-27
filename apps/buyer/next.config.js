/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@pharmabag/ui', '@pharmabag/api-client', '@pharmabag/utils', 'framer-motion'],
  reactStrictMode: true,
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  rewrites: async () => ({
    beforeFiles: [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/:path*` },
    ],
  }),
};

module.exports = nextConfig;
