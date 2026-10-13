import { SiteFooter, SiteHeader } from '@/app/_components/site-shell'
import SolutionFunnel from '@/app/solutions/_components/SolutionFunnel'

export const metadata = {
  title: 'Retirement Income Snapshot',
  description: 'Compare your desired monthly retirement income with predictable income sources and identify the gap your plan must support.',
  alternates: { canonical: '/solutions/retirement-income' },
}

export default function RetirementIncomePage() {
  return (
    <>
      <SiteHeader currentPath="/solutions" />
      <main><SolutionFunnel variant="retirement" /></main>
      <SiteFooter />
    </>
  )
}
