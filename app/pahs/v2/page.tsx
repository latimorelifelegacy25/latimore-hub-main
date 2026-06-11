import type { Metadata } from 'next'
import './pahs-v2.css'
import ScrollReveal from './ScrollReveal'
import PahsProtectForm from './PahsProtectForm'

export const metadata: Metadata = {
  title: 'Protect What You Play For | Latimore Life & Legacy',
  description:
    'Jackson Latimore is a Pottsville local, a Crimson Tide supporter, and a licensed protection specialist. Get your free review — takes 60 seconds. No pressure. No sales pitch.',
  openGraph: {
    title: 'Protect What You Play For | Latimore Life & Legacy',
    description: 'Free protection review for Schuylkill County families. Jackson follows up within 24 hours.',
    url: 'https://www.latimorelifelegacy.com/pahs/v2',
  },
}

export default function PahsV2Page() {
  return (
    <>
      <ScrollReveal />
      <PahsProtectForm />
    </>
  )
}
