import Link from 'next/link'
import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'
import MarketingTools from '@/app/admin/social-os/_components/MarketingTools'
import { MarketingDashboard } from '@/components/nexus/MarketingDashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Marketing Command Center | Latimore OS',
}

const commandCenterLinks = [
  {
    title: 'Content Composer',
    description:
      'Draft campaign copy with metadata, previews, and one-click repository saving.',
    href: '/admin/marketing/composer',
    cta: 'Open Content Composer →',
  },
  {
    title: 'Content Repository',
    description:
      'Create, store, and manage all content assets for campaigns, social, email, and landing pages.',
    href: '/admin/marketing/repository',
    cta: 'Open Content Repository →',
  },
  {
    title: 'Social Publisher',
    description:
      'Publish to Facebook, Instagram, and LinkedIn. Schedule posts and track delivery status.',
    href: '/admin/marketing/publisher',
    cta: 'Open Social Publisher →',
  },
]

export default function MarketingHomePage() {
  return (
    <div className="space-y-8">
      <div className="p-6 md:p-8 pb-0">
        <PageHeader
          eyebrow="Marketing OS"
          title="Marketing Command Center"
          description="Create once. Distribute everywhere. Manage content, campaigns, and social publishing."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {commandCenterLinks.map((item) => (
            <AdminCard key={item.href} title={item.title}>
              <p className="text-sm text-[#A9B1BE] mb-4">{item.description}</p>
              <Link
                href={item.href}
                className="text-sm font-semibold text-blue-400 hover:underline"
              >
                {item.cta}
              </Link>
            </AdminCard>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-8">
        <MarketingTools />
      </div>
      <MarketingDashboard />
    </div>
  )
}
