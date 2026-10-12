import { SiteFooter, SiteHeader } from '@/app/_components/site-shell'
import SolutionFunnel from '@/app/solutions/_components/SolutionFunnel'

export const metadata = {
  title: 'Legacy Cost Snapshot | Latimore Life & Legacy',
  description: 'Estimate immediate final-arrangement, debt, medical, estate, and family funding needs without naming a carrier or proprietary product.',
  alternates: { canonical: '/solutions/legacy-planning' },
}

export default function LegacyPlanningPage() {
  return (
    <>
      <SiteHeader currentPath="/solutions" />
      <main><SolutionFunnel variant="legacy" /></main>
      <SiteFooter />
    </>
  )
}
