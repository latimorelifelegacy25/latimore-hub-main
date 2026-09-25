import { SiteHeaderAuto } from '@/app/_components/site-header-auto'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeaderAuto />
      {children}
    </>
  )
}
