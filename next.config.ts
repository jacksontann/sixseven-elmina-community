import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  // PGlite ships WebAssembly and data files that must be loaded by Node at runtime, not bundled.
  serverExternalPackages: ['@electric-sql/pglite', 'pg'],
  poweredByHeader: false,
  // The floating dev badge overlaps navigation in screen recordings.
  devIndicators: false,
  reactStrictMode: true,
  // Photos up to 5 MB are uploaded through server actions (default limit is 1 MB).
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
