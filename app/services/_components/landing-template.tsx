import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { BRAND, COLORS } from '@/lib/brand'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'

const NAVY = COLORS.navy
const NAVY_HERO = COLORS.navyHero
const GOLD = COLORS.gold
const GOLD_LIGHT = COLORS.goldLight

export interface ComparisonColumn {
  heading: string
  items: string[]
}

export interface StepItem {
  title: string
  description: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface ServiceLandingContent {
  path: string
  eyebrow: string
  heroTitle: ReactNode
  heroSubtitle: string
  solvesIntro: string
  solvesColumns: readonly [ComparisonColumn, ComparisonColumn]
  whoIntro: string
  whoCards: readonly StepItem[]
  howItWorks: readonly StepItem[]
  faqs: readonly FaqItem[]
  closingTitle: ReactNode
  closingSubtitle: string
}

function CtaButtons({ centered = false, large = false }: { centered?: boolean; large?: boolean }) {
  const paddingClass = large ? 'px-8 py-3' : 'px-4 py-2'
  const textClass = large ? 'text-base' : 'text-sm'

  return (
    <div className={`flex flex-wrap gap-4 ${centered ? 'justify-center' : ''}`}>
      <a
        href={BRAND.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-cta="book_click"
        className={`rounded-md font-bold no-underline transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A25F] focus-visible:ring-offset-[#0E1A2B] bg-[#C9A25F] text-[#0E1A2B] ${paddingClass} ${textClass}`}
      >
        Book Free Consultation
      </a>
      <a
        href={BRAND.ethosUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-cta="cta_click"
        className={`rounded-md font-bold no-underline transition-all hover:bg-[#C9A25F]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A25F] focus-visible:ring-offset-[#0E1A2B] bg-transparent text-white border-2 border-[#C9A25F] ${paddingClass} ${textClass}`}
      >
        Get Instant Quote
      </a>
    </div>
  )
}

function ComparisonCard({ column, variant }: { column: ComparisonColumn; variant: 'risk' | 'solution' }) {
  const Icon = variant === 'risk' ? X : Check
  return (
    <article className="bg-white rounded-xl shadow-md border border-black/5 p-6">
      <h3 className="text-lg font-semibold mb-4" style={{ color: GOLD }}>
        {column.heading}
      </h3>
      <ul className="space-y-3">
        {column.items.map((item) => (
          <li key={item} className="flex gap-3 text-gray-700 text-sm leading-relaxed">
            <Icon
              size={16}
              className="flex-shrink-0 mt-0.5"
              style={{ color: variant === 'risk' ? '#b91c1c' : GOLD }}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function InfoCard({ step }: { step: StepItem }) {
  return (
    <article className="bg-white rounded-xl shadow-md border border-black/5 p-6">
      <h3 className="text-lg font-semibold mb-2" style={{ color: NAVY }}>
        {step.title}
      </h3>
      <p className="text-gray-700 text-sm leading-relaxed">{step.description}</p>
    </article>
  )
}

function NumberedStepCard({ step, number }: { step: StepItem; number: number }) {
  return (
    <article className="bg-white rounded-xl shadow-md border border-black/5 p-6">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-full font-extrabold mb-4"
        style={{ background: NAVY, color: GOLD }}
      >
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2" style={{ color: NAVY }}>
        {step.title}
      </h3>
      <p className="text-gray-700 text-sm leading-relaxed">{step.description}</p>
    </article>
  )
}

export function ServiceLandingPage({ content }: { content: ServiceLandingContent }) {
  return (
    <>
      <SiteHeader currentPath={content.path} navLinks={DEFAULT_NAV_LINKS} />

      <main className="font-sans">
        {/* Hero */}
        <section
          className="text-center text-white py-16"
          style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_HERO} 100%)` }}
        >
          <div className="max-w-3xl mx-auto px-5">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: GOLD_LIGHT }}>
              {content.eyebrow}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
              {content.heroTitle}
            </h1>
            <p className="text-white/85 text-lg leading-relaxed mb-8">{content.heroSubtitle}</p>
            <CtaButtons centered large />
          </div>
        </section>

        {/* What This Solves */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-6" style={{ color: NAVY }}>
              What This Solves
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed text-center max-w-3xl mx-auto mb-10">
              {content.solvesIntro}
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <ComparisonCard column={content.solvesColumns[0]} variant="risk" />
              <ComparisonCard column={content.solvesColumns[1]} variant="solution" />
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16" style={{ background: NAVY }}>
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Who It&apos;s For</h2>
            <p className="text-white/75 text-lg text-center max-w-2xl mx-auto mb-10">{content.whoIntro}</p>
            <div className="grid md:grid-cols-3 gap-6">
              {content.whoCards.map((card) => (
                <InfoCard key={card.title} step={card} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ color: NAVY }}>
              How It Works: 3 Steps
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {content.howItWorks.map((step, i) => (
                <NumberedStepCard key={step.title} step={step} number={i + 1} />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16" style={{ background: NAVY }}>
          <div className="max-w-3xl mx-auto px-5">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {content.faqs.map((faq) => (
                <div key={faq.question} className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <h3 className="text-white font-semibold text-lg mb-2">{faq.question}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section
          className="py-16 text-center text-white"
          style={{ background: `linear-gradient(135deg, ${NAVY_HERO} 0%, ${NAVY} 100%)` }}
        >
          <div className="max-w-2xl mx-auto px-5">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD_LIGHT }}>
              Ready to Start?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{content.closingTitle}</h2>
            <p className="text-white/75 text-lg mb-8 leading-relaxed">{content.closingSubtitle}</p>
            <CtaButtons centered large />
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}
