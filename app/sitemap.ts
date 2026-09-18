import { MetadataRoute } from 'next'
import { getBlogSitemapEntries } from './sitemap-blog'

// Resolve the canonical base domain used for generating absolute URLs in the sitemap.
// It can be overridden by setting NEXT_PUBLIC_BASE_URL at deploy time.
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                                   lastModified: new Date(), changeFrequency: 'weekly',   priority: 1.0 },
    { url: `${BASE}/services`,                    lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.95 },
    { url: `${BASE}/products`,                    lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.95 },
    { url: `${BASE}/education`,                   lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${BASE}/education/blog`,              lastModified: new Date(), changeFrequency: 'weekly',   priority: 0.9 },
    { url: `${BASE}/blog`,                        lastModified: new Date(), changeFrequency: 'weekly',   priority: 0.85 },
    { url: `${BASE}/about`,                       lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.8 },
    { url: `${BASE}/contact`,                     lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.85 },
    { url: `${BASE}/book`,                        lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.9 },
    { url: `${BASE}/legacy-checkup`,              lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${BASE}/products/find-my-fit`,         lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/schuylkill`,                   lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${BASE}/faq`,                         lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.75 },

    { url: `${BASE}/solutions`,                    lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/solutions/family-protection`,  lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/solutions/retirement-income`,  lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/solutions/legacy-planning`,    lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },

    { url: `${BASE}/services/life-insurance`,      lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/services/mortgage-protection`, lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/services/retirement-income`,   lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/services/business-continuity`, lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE}/services/estate-planning`,     lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE}/services/college-funding`,     lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE}/services/debt-strategy`,       lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.75 },
    { url: `${BASE}/services/iul-strategy`,        lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.8 },

    { url: `${BASE}/velocity`,                    lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${BASE}/depth`,                       lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${BASE}/group`,                       lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${BASE}/retirement`,                  lastModified: new Date(), changeFrequency: 'monthly',  priority: 0.75 },
    { url: `${BASE}/consult`,                     lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.8 },
    { url: `${BASE}/book-now`,                    lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.8 },

    { url: `${BASE}/legal/privacy`,               lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.2 },
    { url: `${BASE}/legal/terms`,                 lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.2 },
    { url: `${BASE}/legal/disclosures`,           lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.3 },
    ...getBlogSitemapEntries(),
  ]
}
