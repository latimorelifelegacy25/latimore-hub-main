import Link from 'next/link'
import PageHeader from '@/app/admin/_components/PageHeader'
import AdminCard from '@/app/admin/_components/AdminCard'

export const metadata = {
  title: 'Financial | Latimore OS',
}

const financialLinks = [
  {
    title: 'Annuity Platform',
    description: 'Review annuity positioning, client education, and protection planning workflows.',
    href: '/admin/annuity-platform',
  },
  {
    title: 'Asset Vault',
    description: 'Organize assets, documents, and legacy planning resources.',
    href: '/admin/vault',
  },
  {
    title: 'Reports',
    description: 'Monitor production, pipeline metrics, and financial performance reporting.',
    href: '/admin/reports',
  },
]

export default function FinancialHome() {
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        eyebrow="Latimore OS"
        title="Financial Home"
        description="Annuities, assets, legacy planning, and financial reports."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {financialLinks.map((item) => (
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
