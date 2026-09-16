import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/app/_components/site-shell'
import { BRAND, COLORS } from '@/lib/brand'

export const metadata = {
  title: 'Interactive Planning Tools | Latimore Life & Legacy',
  description: 'Carrier-neutral Latimore planning tools for family protection, retirement income, and legacy costs.',
}

const tools = [
  {
    href: '/solutions/family-protection',
    eyebrow: 'Family Protection',
    title: 'Family Protection Snapshot',
    body: 'Turn income, housing, debt, and existing coverage into one educational protection-gap estimate.',
    cta: 'Calculate Family Snapshot',
  },
  {
    href: '/solutions/retirement-income',
    eyebrow: 'Retirement Income',
    title: 'Retirement Income Snapshot',
    body: 'Compare the monthly income you want with the predictable income you already expect and identify the gap.',
    cta: 'Calculate Retirement Snapshot',
  },
  {
    href: '/solutions/legacy-planning',
    eyebrow: 'Legacy Planning',
    title: 'Legacy Cost Snapshot',
    body: 'Estimate immediate final-arrangement, debt, medical, estate, and family funding obligations in one place.',
    cta: 'Calculate Legacy Snapshot',
  },
]

export default function SolutionsPage() {
  return (
    <>
      <SiteHeader currentPath="/solutions" />
      <main style={{ background: COLORS.goldCream, minHeight: '70vh' }}>
        <section style={{ background: `linear-gradient(135deg, ${COLORS.navyDeep}, ${COLORS.navyHero})` }}>
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: COLORS.goldLight }}>Latimore Interactive Planning</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[1.05] text-white md:text-6xl">Start with the question. Then put a number behind it.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">These tools are designed for education and preparation. They do not select a carrier, name a proprietary product, or replace an individual consultation.</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
          <div className="grid gap-6 lg:grid-cols-3">
            {tools.map((tool) => (
              <article key={tool.href} className="flex flex-col rounded-3xl border bg-white p-7 shadow-sm" style={{ borderColor: COLORS.gray200 }}>
                <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>{tool.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-black" style={{ color: COLORS.navy }}>{tool.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-7" style={{ color: COLORS.textMuted }}>{tool.body}</p>
                <Link href={tool.href} className="mt-7 inline-flex rounded-xl px-5 py-3.5 text-sm font-black no-underline" style={{ background: COLORS.navy, color: COLORS.white }}>{tool.cta}</Link>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border p-7 md:p-9" style={{ borderColor: COLORS.goldBorder, background: COLORS.goldPale }}>
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: COLORS.gold }}>{BRAND.hashtag}</p>
                <h2 className="mt-2 text-2xl font-black" style={{ color: COLORS.navy }}>Education-First. Community-Focused. Legacy-Driven.</h2>
                <p className="mt-2 text-sm leading-6" style={{ color: COLORS.textMuted }}>If you already know what you want to review, skip the tool and schedule a complimentary consultation.</p>
              </div>
              <Link href="/book?utm_source=latimore_site&utm_medium=solutions_hub&utm_campaign=interactive_tools" className="rounded-xl px-6 py-3.5 text-center text-sm font-black no-underline" style={{ background: COLORS.gold, color: COLORS.navyDeep }}>Schedule Consultation</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
