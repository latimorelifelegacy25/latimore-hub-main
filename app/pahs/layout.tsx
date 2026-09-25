import type { Metadata } from 'next'
import { SiteHeaderAuto } from '@/app/_components/site-header-auto'

const title = 'PAHS Protect 2026 | Pottsville Football Sponsor'
const description =
  'Latimore Life & Legacy LLC proudly supports Pottsville Area football and gives Coal Region families a direct path to an education-first protection review.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/pahs' },
  openGraph: {
    title: `${title} | Latimore Life & Legacy`,
    description,
    url: '/pahs',
    type: 'website',
    images: [
      {
        url: '/pahs-all-star-sponsor.webp',
        alt: 'Latimore Life & Legacy LLC — Proud PAHS All-Star Sponsor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | Latimore Life & Legacy`,
    description,
    images: ['/pahs-all-star-sponsor.webp'],
  },
}

export default function PAHSLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeaderAuto />
      {children}
    </>
  )
}
