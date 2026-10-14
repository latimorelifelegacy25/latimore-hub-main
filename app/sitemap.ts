import { MetadataRoute } from 'next'
import { getBlogSitemapEntries } from './sitemap-blog'

// Resolve the canonical base domain used for generating absolute URLs in the sitemap.
// It can be overridden by setting NEXT_PUBLIC_BASE_URL at deploy time.
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.latimorelifelegacy.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                                   changeFrequency: 'weekly',   priority: 1.0 },
    { url: `${BASE}/services`,                    changeFrequency: 'monthly',  priority: 0.95 },
    { url: `${BASE}/services/funnel`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/products`,                    changeFrequency: 'monthly',  priority: 0.95 },
    { url: `${BASE}/education`,                   changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${BASE}/education/checkup`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/blog`,                        changeFrequency: 'weekly',   priority: 0.85 },
    { url: `${BASE}/pahs`, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${BASE}/about`,                       changeFrequency: 'yearly',   priority: 0.8 },
    { url: `${BASE}/contact`,                     changeFrequency: 'yearly',   priority: 0.85 },
    { url: `${BASE}/join`,                        changeFrequency: 'monthly',  priority: 0.65 },
    { url: `${BASE}/book`,                        changeFrequency: 'yearly',   priority: 0.9 },
    { url: `${BASE}/products/find-my-fit`,         changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/schuylkill`,                   changeFrequency: 'monthly',  priority: 0.9 },
    { url: `${BASE}/faq`,                         changeFrequency: 'monthly',  priority: 0.75 },

    { url: `${BASE}/solutions`,                    changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/solutions/family-protection`,  changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/solutions/retirement-income`,  changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/solutions/legacy-planning`,    changeFrequency: 'monthly',  priority: 0.85 },

    { url: `${BASE}/services/life-insurance`,      changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/services/mortgage-protection`, changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/services/retirement-income`,   changeFrequency: 'monthly',  priority: 0.85 },
    { url: `${BASE}/services/business-continuity`, changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE}/services/estate-planning`,     changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE}/services/college-funding`,     changeFrequency: 'monthly',  priority: 0.8 },
    { url: `${BASE}/services/debt-strategy`,       changeFrequency: 'monthly',  priority: 0.75 },
    { url: `${BASE}/services/iul-strategy`,        changeFrequency: 'monthly',  priority: 0.8 },

    { url: `${BASE}/consult`,                     changeFrequency: 'yearly',   priority: 0.8 },

    { url: `${BASE}/legal/privacy`,               changeFrequency: 'yearly',   priority: 0.2 },
    { url: `${BASE}/legal/terms`,                 changeFrequency: 'yearly',   priority: 0.2 },
    { url: `${BASE}/legal/disclosures`,           changeFrequency: 'yearly',   priority: 0.3 },
    ...getBlogSitemapEntries(),
  ]
}
