import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/thank-you'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com'}/sitemap.xml`,
  }
}
