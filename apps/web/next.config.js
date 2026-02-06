/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Production optimizations
  compress: true, // Enable gzip compression for responses
  poweredByHeader: false, // Security: hide X-Powered-By header
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.neon.tech',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
    // Enable modern image formats for better compression
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

