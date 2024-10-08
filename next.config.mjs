/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

module.exports = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'example.com',
        },
      ],
    },
  };