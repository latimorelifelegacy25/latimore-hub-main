import Link from 'next/link'
import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'

export const metadata = {
  title: 'Operations | Latimore OS',
}

const operationsLinks = [
  {
    title: 'Workflow Builder',
    description: 'Design automations, intake flows, and internal operating procedures.',
    href: '/admin/workflow',
  },
  {
    title: 'Autonomous Monitor',
    description: 'Review automation health, active alerts, and execution telemetry.',
    href: '/admin/autonomous-monitor',
  },
  {
    title: 'Portals & Links',
    description: 'Centralize carrier portals, vendor tools, and internal reference links.',
    href: '/admin/links',
  },
]

export default function OperationsHome() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Latimore OS"
        title="Operations Home"
        description="Workflows, automation, portals, and internal systems."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {operationsLinks.map((item) => (
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
