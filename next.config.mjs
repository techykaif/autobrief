/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Vercel handles compression and optimization natively
  compress: true,
}

export default nextConfig
