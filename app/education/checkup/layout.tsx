import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Legacy Checkup | Latimore Life & Legacy',
  description: 'Explore an education-first Legacy Checkup for life insurance, family protection, retirement income, and legacy planning in Pennsylvania’s Coal Region.',
  alternates: { canonical: '/education/checkup' },
}

export default function CheckupLayout({ children }: { children: React.ReactNode }) {
  return children
}
