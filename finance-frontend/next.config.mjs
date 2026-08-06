/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '192.168.100.9',
    'localhost:3000',
    '192.168.100.9:3000',
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;