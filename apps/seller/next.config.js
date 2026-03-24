/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@pharmabag/utils"],
  compiler: { removeConsole: process.env.NODE_ENV === "production" },
  rewrites: async () => ({
    beforeFiles: [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/:path*` },
    ],
  }),
};
module.exports = nextConfig;
