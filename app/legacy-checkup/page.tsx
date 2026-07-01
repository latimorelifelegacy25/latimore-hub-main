import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

// SPEC-HARDENING §3 — Primary funnel route must be /legacy-checkup
// /education/checkup is the alias; this page is the canonical entry point.
export const metadata: Metadata = {
  title: 'Legacy Checkup | Latimore Life & Legacy',
  description:
    'Start your free Legacy Checkup — a guided education experience for Central Pennsylvania families to discover the right life insurance and financial protection strategies.',
  alternates: { canonical: '/legacy-checkup' },
}

export default function LegacyCheckupPage() {
  redirect('/education/checkup')
}
