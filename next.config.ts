import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bgabtiaouaycwdpspclg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year — Vercel won't re-optimise the same image URL until it changes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 192, 256, 384], // added 160/192 for dense product grids
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['revoluzion.my', 'www.revoluzion.my'],
    },
  },
  async headers() {
    return [
      {
        // Immutable static assets — hashed filenames, safe to cache forever
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Static files in /public (icons, manifests, etc.)
        source: '/(.*\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2|woff|ttf|otf))',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
}

export default nextConfig
