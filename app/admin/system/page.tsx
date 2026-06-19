import Link from 'next/link'
import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'

export const metadata = {
  title: 'System | Latimore OS',
}

const systemLinks = [
  {
    title: 'Settings',
    description: 'Manage core configuration and admin preferences.',
    href: '/admin/settings',
  },
  {
    title: 'Integrations',
    description: 'Connect external systems, data providers, and automation services.',
    href: '/admin/connectors',
  },
  {
    title: 'Social Connections',
    description: 'Configure social publishing accounts and platform connections.',
    href: '/admin/social-connections',
  },
]

export default function SystemHome() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Latimore OS"
        title="System Settings"
        description="Core configuration, admin settings, and integrations."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {systemLinks.map((item) => (
          <AdminCard key={item.href} title={item.title}>
            <p className="mb-4 text-sm text-[#A9B1BE]">{item.description}</p>
            <Link href={item.href} className="text-sm font-semibold text-blue-400 hover:underline">
              Open {item.title} →
            </Link>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
