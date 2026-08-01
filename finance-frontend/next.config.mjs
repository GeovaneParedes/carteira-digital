/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '192.168.100.9',
    'localhost:3000',
    '192.168.100.9:3000',
  ],
  output: process.env.NEXT_OUTPUT_MODE || 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;