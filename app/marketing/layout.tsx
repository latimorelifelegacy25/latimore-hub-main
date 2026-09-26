import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Insurance Quote Calculator | Latimore Life & Legacy',
  description: 'Estimate life insurance and annuity options with Latimore Life & Legacy.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#0B0F17', minHeight: '100vh', color: '#F7F7F5' }}>
      {children}
    </div>
  )
}
