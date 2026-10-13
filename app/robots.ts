import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/analytics', '/dashboard', '/crm', '/os', '/composer', '/login', '/api'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com'}/sitemap.xml`,
  }
}
