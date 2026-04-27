import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  // Mark Prisma as server-only to prevent client-side bundling
  serverExternalPackages: ['@prisma/client', '@ffmpeg-installer/ffmpeg'],
  // Vercel's serverless bundler tree-shakes the ffmpeg binary unless we
  // explicitly include the platform-specific @ffmpeg-installer payload.
  outputFileTracingIncludes: {
    '/api/shareable-directives/finalize': [
      './node_modules/@ffmpeg-installer/**',
    ],
  },
};

export default nextConfig;
