'use client'

import { useState } from 'react'
import {
  TrendingUp,
  Lock,
  GraduationCap,
  CreditCard,
  Shield,
  Building2,
  LineChart,
  Home,
  Users,
  Wallet,
  Check,
  X,
  Send,
  Loader2,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { BRAND, COLORS } from '@/lib/brand'
import { hydrateLeadContext } from '@/lib/lead'

const GOLD = COLORS.gold
const GOLD_LIGHT = COLORS.goldLight

type Service = {
  num: string
  icon: typeof TrendingUp
  title: string
  tag: string
  bestFor: string
  bullets: string[]
  asset: string
}

const SERVICES: Service[] = [
  {
    num: '01',
    icon: TrendingUp,
    title: 'Tax-Advantaged Wealth Accumulation',
    tag: 'Working professionals & high earners',
    bestFor: 'Best for: Working professionals, self-employed individuals, and high earners.',
    bullets: [
      'Indexed and fixed strategies that grow without market risk',
      'Tax-deferred accumulation inside annuities and permanent life policies',
      'Tax-free distributions via policy loans for retirement income',
      'Reduces your taxable estate over time',
      'Complements — not replaces — your existing 401(k) or IRA',
    ],
    asset: 'funnel-tax-advantaged',
  },
  {
    num: '02',
    icon: Lock,
    title: 'Asset Protection & Plan Rollovers',
    tag: 'Job changers & retirees',
    bestFor: 'Best for: Job changers, retirees, anyone with a 401(k), 403(b), or pension.',
    bullets: [
      'Tax-free, penalty-free 401(k) and 403(b) rollover guidance',
      'Pension lump-sum vs. annuity analysis',
      'Principal protection from market volatility',
      'Guaranteed growth options through fixed vehicles',
      'Retain control of your funds without employer restrictions',
    ],
    asset: 'funnel-asset-protection',
  },
  {
    num: '03',
    icon: GraduationCap,
    title: 'College Education Funding',
    tag: 'Parents & grandparents planning ahead',
    bestFor: "Best for: Parents and grandparents planning ahead for a child's education.",
    bullets: [
      'Cash-value life insurance as a flexible education savings vehicle',
      'No restrictions on how funds are used — not just tuition',
      'Tax-free access via policy loans when needed',
      'May not count against financial aid eligibility',
      'Funds remain available if the child does not attend college',
    ],
    asset: 'funnel-college-funding',
  },
  {
    num: '04',
    icon: CreditCard,
    title: 'Debt Management',
    tag: 'Families carrying high-interest debt',
    bestFor: 'Best for: Families carrying high-interest debt limiting their financial progress.',
    bullets: [
      'Identify which debts to prioritize and in what order',
      'Use policy cash value to consolidate or eliminate debt',
      'Free up monthly cash flow for savings and protection',
      'Build a foundation that does not collapse under unexpected expenses',
      'Coordination with life insurance and living benefit strategies',
    ],
    asset: 'funnel-debt-management',
  },
  {
    num: '05',
    icon: Shield,
    title: 'Life Insurance & Living Benefits',
    tag: 'Individuals & families at any stage',
    bestFor: 'Best for: Individuals and families at any stage of life.',
    bullets: [
      'Term, whole life, and indexed universal life options',
      'Critical illness, chronic illness, and terminal illness riders',
      'Income replacement for your family if you pass away',
      'Final expense coverage to prevent burial costs falling on loved ones',
      'Disability waiver of premium to keep coverage in force',
    ],
    asset: 'funnel-life-insurance',
  },
  {
    num: '06',
    icon: Building2,
    title: 'Estate & Legacy Planning',
    tag: 'Business owners & property owners',
    bestFor: 'Best for: Business owners, property owners, families wanting to transfer wealth.',
    bullets: [
      'Life insurance as a tax-free wealth transfer vehicle',
      'Beneficiary designation review and optimization',
      'Strategies to minimize estate tax exposure',
      'Funding for buy-sell agreements between business partners',
      'Coordination with your attorney for wills and trusts',
    ],
    asset: 'funnel-estate-planning',
  },
  {
    num: '07',
    icon: LineChart,
    title: 'Indexed Growth Strategies',
    tag: 'Savers & pre-retirees',
    bestFor: 'Best for: Savers and pre-retirees who want market-linked growth without market risk.',
    bullets: [
      'Cash value linked to indexes like the S&P 500',
      'Zero-loss floor — market drops cannot reduce your balance',
      'Participation rates and cap rates determine your share of gains',
      'Available inside both indexed universal life and fixed indexed annuities',
      'Tax-deferred growth throughout the accumulation phase',
    ],
    asset: 'funnel-indexed-growth',
  },
  {
    num: '08',
    icon: Home,
    title: 'Mortgage Protection',
    tag: 'Homeowners with dependents',
    bestFor: 'Best for: Homeowners with a mortgage and dependents relying on their income.',
    bullets: [
      'Coverage designed to match your mortgage balance',
      'Pays directly to your beneficiary — not the lender',
      'Many policies include return-of-premium options',
      'Living benefit riders available on many policies',
      'Affordable coverage often available without a full medical exam',
    ],
    asset: 'funnel-mortgage-protection',
  },
  {
    num: '09',
    icon: Users,
    title: 'Business & Key-Person Insurance',
    tag: 'Small business owners & partnerships',
    bestFor: 'Best for: Small business owners, partnerships, organizations dependent on key staff.',
    bullets: [
      'Policy owned by the business on a critical employee',
      'Tax-free death benefit received directly by the business',
      'Funds buy-sell agreements between partners',
      'Covers revenue loss, loan obligations, and recruitment costs',
      'Can be used to attract and retain key talent as a benefit',
    ],
    asset: 'funnel-key-person',
  },
  {
    num: '10',
    icon: Wallet,
    title: 'Retirement Income Strategies',
    tag: 'Pre-retirees & retirees',
    bestFor: 'Best for: Pre-retirees and retirees wanting guaranteed income they cannot outlive.',
    bullets: [
      'Fixed and fixed-indexed annuities for principal-protected accumulation',
      'Guaranteed lifetime income riders — payments you cannot outlive',
      'Structured to complement Social Security and other income',
      'Eliminate sequence-of-returns risk in your portfolio',
      'Joint life options to protect a surviving spouse',
    ],
    asset: 'funnel-retirement-income',
  },
]

type Step = 1 | 2 | 3

export default function ServicesFunnel() {
  const [activeService, setActiveService] = useState<Service | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function openModal(service: Service) {
    setActiveService(service)
    setStep(1)
    setError('')
  }

  function closeModal() {
    setActiveService(null)
    setName('')
    setEmail('')
    setPhone('')
    setError('')
    setSubmitting(false)
  }

  async function submitLead() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Please populate all contact fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Verify email address syntax.')
      return
    }
    setError('')
    setSubmitting(true)

    const context = hydrateLeadContext()

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          coverage_interest: activeService?.title ?? 'General',
          asset: activeService?.asset ?? 'services-funnel',
          source: context.source ?? 'website_funnel',
          utm_source: context.source ?? undefined,
          utm_medium: context.medium ?? undefined,
          utm_campaign: context.campaign ?? undefined,
          utm_term: context.term ?? undefined,
          utm_content: context.content ?? undefined,
          leadSessionId: context.leadSessionId,
          pageUrl: context.pageUrl,
          referrer: context.referrer ?? undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Submission failed.')
      }

      setStep(3)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#0B0F17', color: '#F0EDE8' }}>
      <header className="mx-auto max-w-3xl text-center pb-8 pt-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-3" style={{ color: GOLD }}>
          {BRAND.advisor}
        </p>
        <h1 className="text-2xl md:text-3xl font-normal leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
          10 Strategies to Build,
          <br />
          Protect &amp; Transfer Wealth
        </h1>
        <p className="text-sm text-[#8A9BAE] mt-3 leading-relaxed">
          As an independent consultant, every strategy is customized to your income, family situation, and legacy
          goals.
        </p>
        <div className="mx-auto mt-6 mb-2 flex max-w-xs items-center gap-2 opacity-40">
          <span className="h-px flex-1" style={{ background: GOLD }} />
          <Activity size={18} style={{ color: GOLD }} aria-hidden="true" />
          <span className="h-px flex-1" style={{ background: GOLD }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
        {SERVICES.map((service) => {
          const Icon = service.icon
          return (
            <button
              key={service.num}
              type="button"
              onClick={() => openModal(service)}
              aria-label={`Learn about ${service.title}`}
              className="group relative flex flex-col gap-2.5 rounded-2xl border border-white/[0.07] bg-[#131820] p-4 pt-5 text-left transition-all hover:-translate-y-0.5 hover:border-[#C9A25F]/30 hover:bg-[#1c2330]"
            >
              <span
                className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_LIGHT})` }}
              />
              <span className="text-[10px] font-bold tracking-wider" style={{ color: GOLD }}>
                {service.num} / 10
              </span>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[11px] border"
                style={{ background: 'rgba(196,154,108,0.1)', borderColor: 'rgba(196,154,108,0.2)', color: GOLD }}
              >
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="text-[13px] font-semibold leading-snug text-[#F0EDE8]">{service.title}</span>
              <span className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-2.5">
                <span className="flex-1 pr-1.5 text-[10px] leading-tight text-[#5A6B7A]">{service.tag}</span>
                <span
                  className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full transition-colors group-hover:bg-[#C9A25F] group-hover:text-white"
                  style={{ background: 'rgba(196,154,108,0.12)', color: GOLD }}
                >
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <footer className="mx-auto mt-12 max-w-3xl border-t border-white/[0.07] pt-8 text-center text-[11px] leading-[1.7] text-[#5A6B7A]">
        <p>
          <span style={{ color: GOLD }}>{BRAND.fullName}</span> · Independent Insurance Advisor ·{' '}
          {BRAND.affiliation}
          <br />
          PA License #{BRAND.paLicense} · NIPR #{BRAND.nipr} · {BRAND.counties.join(', ')} Counties, PA
          <br />
          Life insurance and annuity products are subject to underwriting approval. Rates and availability vary by
          individual factors.
        </p>
      </footer>

      {activeService ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div className="relative w-full max-w-md rounded-[18px] border border-[#C9A25F]/20 bg-[#131820] p-7 pt-8">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close dialog"
              className="absolute right-4 top-3.5 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/[0.06] text-[#8A9BAE] transition-colors hover:bg-white/[0.12] hover:text-white"
            >
              <X size={16} aria-hidden="true" />
            </button>

            <div className="mb-6 flex gap-2">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className="h-[3px] rounded-sm transition-all"
                  style={{
                    width: n === step ? 44 : 32,
                    background: n <= step ? GOLD : 'rgba(255,255,255,0.07)',
                    opacity: n < step ? 0.45 : 1,
                  }}
                />
              ))}
            </div>

            {step === 1 ? (
              <div>
                <div
                  className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[13px] border"
                  style={{ background: 'rgba(196,154,108,0.1)', borderColor: 'rgba(196,154,108,0.25)', color: GOLD }}
                >
                  <activeService.icon size={26} aria-hidden="true" />
                </div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                  {activeService.num} of 10
                </p>
                <h2 className="mb-2 text-xl font-normal leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  {activeService.title}
                </h2>
                <p className="mb-5 text-[13px] leading-relaxed text-[#8A9BAE]">{activeService.bestFor}</p>
                <ul className="mb-6 flex flex-col gap-2">
                  {activeService.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#F0EDE8]">
                      <span
                        className="mt-[6px] h-[5px] w-[5px] flex-shrink-0 rounded-full"
                        style={{ background: GOLD }}
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#2C3E50] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a2633]"
                >
                  I&apos;m Interested — What&apos;s Next <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                  Free protection review
                </p>
                <h2 className="mb-2 text-xl font-normal leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                  Where should Jackson send your personalized strategy?
                </h2>
                <p className="mb-5 text-[13px] leading-relaxed text-[#8A9BAE]">
                  No spam. No pressure. Just a clear, bespoke plan built for you.
                </p>

                <div className="mb-3.5">
                  <label htmlFor="funnel-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A9BAE]">
                    Full Name
                  </label>
                  <input
                    id="funnel-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    className="w-full rounded-[9px] border border-[#C9A25F]/20 bg-[#1c2330] px-3.5 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A25F]"
                  />
                </div>
                <div className="mb-3.5">
                  <label htmlFor="funnel-email" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A9BAE]">
                    Email Address
                  </label>
                  <input
                    id="funnel-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    autoComplete="email"
                    className="w-full rounded-[9px] border border-[#C9A25F]/20 bg-[#1c2330] px-3.5 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A25F]"
                  />
                </div>
                <div className="mb-3.5">
                  <label htmlFor="funnel-phone" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A9BAE]">
                    Phone Number
                  </label>
                  <input
                    id="funnel-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={BRAND.phone}
                    autoComplete="tel"
                    className="w-full rounded-[9px] border border-[#C9A25F]/20 bg-[#1c2330] px-3.5 py-3 text-sm text-[#F0EDE8] outline-none focus:border-[#C9A25F]"
                  />
                </div>

                {error ? <p className="mb-2.5 text-xs text-[#e06060]">{error}</p> : null}

                <button
                  type="button"
                  onClick={submitLead}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C9A25F] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D4B08A] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} aria-hidden="true" /> Submit &amp; Schedule My Consultation
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-[10px] leading-[1.6] text-[#5A6B7A]">
                  {BRAND.advisor} · PA License #{BRAND.paLicense} · NIPR #{BRAND.nipr}
                  <br />
                  Licensed in Pennsylvania · {BRAND.counties.join(' · ')} Counties
                  <br />
                  Life insurance and annuity products are subject to underwriting approval.
                </p>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="text-center">
                <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border text-3xl"
                  style={{ background: 'rgba(196,154,108,0.12)', borderColor: 'rgba(196,154,108,0.3)', color: GOLD }}
                >
                  <Check size={30} aria-hidden="true" />
                </div>
                <h2 className="mb-2 text-2xl font-normal" style={{ fontFamily: 'Georgia, serif' }}>
                  Thank you, {name.split(' ')[0]}!
                </h2>
                <p className="mb-6 text-[13px] leading-relaxed text-[#8A9BAE]">
                  Jackson will review your strategy criteria and follow up with you shortly. Lock in a time below —
                  it&apos;s a completely free, no-pressure consultation.
                </p>
                <a
                  href={BRAND.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#C9A25F] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D4B08A]"
                >
                  Book My Free Consultation
                </a>
                <div className="mt-5 flex items-center gap-2.5">
                  <span className="h-px flex-1 bg-white/[0.07]" />
                  <span className="whitespace-nowrap text-[11px] text-[#5A6B7A]">
                    <Activity size={12} className="mr-1 inline" style={{ color: GOLD }} aria-hidden="true" />
                    {BRAND.hashtag}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.07]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
