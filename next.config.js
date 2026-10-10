const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint and TypeScript errors now fail the build — do not re-disable without fixing the root cause.
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname),
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  async headers() {
    return [
      {
        // Allow the public booking flow to be framed by the landing page.
        // Browsers honor CSP frame-ancestors over X-Frame-Options, so the
        // global DENY below does not block /book once this policy is present.
        // Add the landing page's origin to frame-ancestors if it is hosted
        // off latimorelifelegacy.com (space-separated, e.g. 'self' https://example.com).
        source: '/book',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'latimorelifelegacy.com' }],
        destination: 'https://www.latimorelifelegacy.com/:path*',
        permanent: true,
      },
      { source: '/home', destination: '/', permanent: true },
      // Duplicate articles merged into a single canonical post.
      ...[
        ['term-whole-life-iul-plain-english', 'term-vs-whole-life-vs-iul'],
        ['gregory-moyer-story-preparedness', 'gregory-w-moyer-story'],
        ['key-person-insurance-pennsylvania-schools', 'key-person-insurance-school-districts'],
        ['fixed-annuities-vs-iul-retirement', 'fixed-annuities-vs-iuls-after-55'],
        ['hospital-stay-wiped-out-savings-living-benefits', 'one-hospital-stay-wiped-out-savings'],
        ['what-happens-family-dies-mortgage', 'what-happens-family-mortgage'],
        ['financial-moves-parents-putting-off', 'five-financial-moves-putting-off'],
      ].flatMap(([from, to]) => [
        { source: `/blog/${from}`, destination: `/blog/${to}`, permanent: true },
        { source: `/education/blog/${from}`, destination: `/blog/${to}`, permanent: true },
      ]),
      // /blog is the single canonical article URL space (the RSS feed stays put).
      { source: '/education/blog', destination: '/blog', permanent: true },
      { source: '/education/blog/:slug((?!rss\\.xml$)[^/]+)', destination: '/blog/:slug', permanent: true },
      // The Marketing Command Center is an internal tool; it lives behind admin auth now.
      { source: '/marketing', destination: '/admin/marketing/command-center', permanent: false },
      { source: '/pahs/index.html', destination: '/pahs', permanent: true },
      {
        source: '/',
        destination: '/admin',
        permanent: false,
        has: [{ type: 'host', value: 'hub.latimorelifelegacy.com' }],
      },
    ]
  },
}

module.exports = nextConfig
