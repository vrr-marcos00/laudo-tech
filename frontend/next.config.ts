import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'https', hostname: 'pub-1c53433dbedb4e718ff33c6a79cd4a6e.r2.dev' },
    ],
  },
}

export default nextConfig
