import { SiteFooter, SiteHeader } from '@/app/_components/site-shell'
import SolutionFunnel from '@/app/solutions/_components/SolutionFunnel'

export const metadata = {
  title: 'Family Protection Snapshot | Latimore Life & Legacy',
  description: 'Estimate the household protection gap behind income, housing, debt, childcare, and current coverage.',
}

export default function FamilyProtectionPage() {
  return (
    <>
      <SiteHeader currentPath="/solutions" />
      <main><SolutionFunnel variant="family" /></main>
      <SiteFooter />
    </>
  )
}
