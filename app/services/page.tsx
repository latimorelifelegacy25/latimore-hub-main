import type { ReactNode } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/brand'
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
  Baby,
  Target,
  Briefcase,
  Landmark,
  HeartPulse,
  Wrench,
  Check,
} from 'lucide-react'
import { SiteHeader, SiteFooter, DEFAULT_NAV_LINKS } from '@/app/_components/site-shell'

function gbpServiceUrl(href: string): string {
  const slug = href.split('/').filter(Boolean).pop() ?? 'service'
  return `${href}?utm_source=google&utm_medium=business_profile&utm_campaign=gbp_services&utm_content=${slug}`
}

interface Service {
  number: string
  icon: ReactNode
  title: string
  who: string
  summary: string
  points: string[]
  learnMoreHref?: string
}

interface ClientSegment {
  icon: ReactNode
  title: string
  description: string
}

const NAVY = '#0E1A2B'
const GOLD = '#C9A24D'
const GOLD_LIGHT = '#E5C882'

const services: Service[] = [
  {
    number: '01',
    icon: <TrendingUp size={28} aria-hidden="true" />,
    title: 'Tax-Advantaged Wealth Accumulation',
    who: 'Working professionals, self-employed individuals, high earners',
    summary:
      'Evaluate insurance vehicles that may provide tax-deferred accumulation and, when properly structured, potentially tax-advantaged access — alongside rather than as a substitute for qualified retirement plans.',
    points: [
      'Indexed insurance products use external-index crediting formulas and do not directly invest in the market',
      'Tax-deferred accumulation may be available inside annuities and permanent life policies',
      'Policy loans and withdrawals may provide flexible access; tax treatment depends on policy structure and current law',
      'Loans, withdrawals, policy charges, and lapse risk can reduce cash value and death benefits',
      'Designed to complement — not automatically replace — a 401(k), IRA, or other retirement strategy',
    ],
    learnMoreHref: '/services/iul-strategy',
  },
  {
    number: '02',
    icon: <Lock size={28} aria-hidden="true" />,
    title: 'Asset Protection & Plan Rollovers',
    who: 'Job changers, retirees, anyone with a 401(k), 403(b), or pension',
    summary:
      'When you leave a job or retire, compare the existing plan, a new employer plan, an IRA, and suitable insurance options based on taxes, fees, liquidity, protections, and income goals.',
    points: [
      'Eligible direct rollovers may preserve tax-deferred status when IRS and plan rules are followed',
      'Pension lump-sum and annuity options should be compared using plan-specific terms',
      'Fixed and fixed indexed annuities may offer contractual principal protections subject to contract provisions',
      'Surrender charges, rider costs, withdrawal limits, and carrier guarantees must be reviewed before transfer',
      'Roth, after-tax, TSP, 457, and other account types may have different rollover rules',
    ],
    learnMoreHref: '/services/401k-rollover',
  },
  {
    number: '03',
    icon: <GraduationCap size={28} aria-hidden="true" />,
    title: 'College Education Funding',
    who: "Parents and grandparents planning ahead for a child's education",
    summary:
      'Compare education-focused savings options with life-insurance-based strategies based on protection needs, liquidity, taxes, costs, and current financial-aid rules.',
    points: [
      'Permanent life insurance may build cash value while also providing a death benefit',
      'Policy loans or withdrawals are not limited to qualified education expenses, but they reduce policy values',
      'Cash value generally grows tax-deferred; access may receive favorable tax treatment when requirements are met',
      'Under current FAFSA rules, life-insurance cash value generally is not reported as an investment asset; other aid methodologies may differ',
      '529 plans and life insurance serve different purposes and should be compared on their actual tradeoffs',
    ],
    learnMoreHref: '/services/college-funding',
  },
  {
    number: '04',
    icon: <CreditCard size={28} aria-hidden="true" />,
    title: 'Debt Education & Cash-Flow Review',
    who: 'Families carrying high-interest debt that limits financial flexibility',
    summary:
      'Review debt priorities, household cash flow, and protection needs so high-interest obligations do not crowd out emergency reserves and essential insurance coverage.',
    points: [
      'Identify high-interest debts and prioritize them based on cost and household risk',
      'Evaluate cash-flow tradeoffs before using any policy value or other asset to address debt',
      'Policy loans reduce cash value and death benefits and can create tax consequences if a policy lapses',
      'Coordinate debt reduction with emergency savings and essential insurance protection',
      'Education-first review; debt, tax, and legal decisions may require other qualified professionals',
    ],
    learnMoreHref: '/services/debt-strategy',
  },
  {
    number: '05',
    icon: <Shield size={28} aria-hidden="true" />,
    title: 'Life Insurance & Living Benefits',
    who: 'Individuals and families at any stage of life',
    summary:
      'Compare term and permanent life insurance based on the amount and duration of protection your household needs, your health profile, and your budget.',
    points: [
      'Term, whole life, and indexed universal life options',
      'Critical, chronic, and terminal illness riders may be available subject to policy terms',
      'Death benefits can support income replacement, mortgage needs, education, and final expenses',
      'Life-insurance death benefits are generally income-tax-free under current federal law',
      'Underwriting, riders, exclusions, charges, and guarantees vary by policy and carrier',
    ],
    learnMoreHref: '/services/life-insurance',
  },
  {
    number: '06',
    icon: <Building2 size={28} aria-hidden="true" />,
    title: 'Estate & Legacy Coordination',
    who: 'Business owners, property owners, and families planning wealth transfer',
    summary:
      'Coordinate life insurance and beneficiary planning with estate documents prepared by qualified attorneys so the insurance structure supports your broader legacy goals.',
    points: [
      'Life-insurance death benefits are generally income-tax-free under current federal law, subject to individual circumstances',
      'Review insurance beneficiary designations and ownership structure',
      'Life insurance may provide estate liquidity; estate-tax treatment depends on legal and tax structure',
      'Insurance can help fund properly drafted buy-sell arrangements',
      'Wills, trusts, powers of attorney, and legal estate documents should be prepared by qualified counsel',
    ],
    learnMoreHref: '/services/estate-planning',
  },
  {
    number: '07',
    icon: <LineChart size={28} aria-hidden="true" />,
    title: 'Indexed Insurance Strategies',
    who: 'Savers and pre-retirees evaluating index-linked insurance crediting',
    summary:
      'Indexed life insurance and fixed indexed annuities may credit interest using external-index formulas while avoiding direct ownership of the underlying index.',
    points: [
      'Crediting can reference indexes such as the S&P 500 without directly investing in that index',
      'A 0% index-crediting floor can prevent a negative credit solely from index performance, but charges and withdrawals may reduce value',
      'Caps, participation rates, spreads, and crediting periods affect credited interest',
      'Indexed universal life and fixed indexed annuities have different purposes, risks, liquidity, and tax rules',
      'Product guarantees depend on contract terms and the claims-paying ability of the issuing insurer',
    ],
    learnMoreHref: '/services/iul-strategy',
  },
  {
    number: '08',
    icon: <Home size={28} aria-hidden="true" />,
    title: 'Mortgage Protection',
    who: 'Homeowners with a mortgage and dependents relying on their income',
    summary:
      'Life insurance can be sized around mortgage and income-replacement needs so beneficiaries have resources available after a covered death.',
    points: [
      'Coverage can be designed around your mortgage balance and remaining term',
      'The named beneficiary receives the death benefit and decides how the proceeds are used',
      'Return-of-premium features are available on some products and typically affect cost',
      'Living-benefit riders may be available subject to eligibility and policy terms',
      'Simplified-underwriting or no-exam options may be available for eligible applicants',
    ],
    learnMoreHref: '/services/mortgage-protection',
  },
  {
    number: '09',
    icon: <Users size={28} aria-hidden="true" />,
    title: 'Business & Key-Person Insurance',
    who: 'Small business owners, partnerships, and organizations dependent on key people',
    summary:
      'Key-person and business-owned life insurance can provide liquidity after the death of a covered owner or employee, subject to policy and tax-law requirements.',
    points: [
      'A business may own coverage on a key employee or owner when insurable-interest and notice/consent rules are satisfied',
      'Death-benefit tax treatment depends on the structure and applicable employer-owned life-insurance rules',
      'Life insurance may fund obligations under a properly drafted buy-sell agreement',
      'Proceeds can provide liquidity for recruitment, debt, operating expenses, or transition costs',
      'Executive-benefit arrangements have tax and legal requirements that should be coordinated with qualified professionals',
    ],
    learnMoreHref: '/services/business-continuity',
  },
  {
    number: '10',
    icon: <Wallet size={28} aria-hidden="true" />,
    title: 'Retirement Income Strategies',
    who: 'Pre-retirees and retirees evaluating contract-based lifetime income options',
    summary:
      'Certain annuity contracts or optional riders may provide contract-based lifetime income when their conditions are met, alongside Social Security and other retirement resources.',
    points: [
      'Fixed and fixed indexed annuities may provide contractual principal protections subject to product terms',
      'Optional lifetime-income riders may provide payments for life when contract conditions are met',
      'Coordinate annuity income with Social Security, pensions, qualified-plan assets, and cash reserves',
      'A guaranteed-income allocation may help reduce reliance on selling market assets during downturns; it does not eliminate all retirement risks',
      'Joint-life options may be available to support a surviving spouse, subject to contract terms',
    ],
    learnMoreHref: '/services/retirement-income',
  },
]

const clientSegments: ClientSegment[] = [
  {
    icon: <Baby size={32} aria-hidden="true" />,
    title: 'Young Families',
    description: 'Income replacement, mortgage protection, and foundational coverage while family obligations are growing.',
  },
  {
    icon: <Target size={32} aria-hidden="true" />,
    title: 'Pre-Retirees',
    description: 'Rollover education, principal-protection options, and contract-based lifetime-income planning.',
  },
  {
    icon: <Briefcase size={32} aria-hidden="true" />,
    title: 'Business Owners',
    description: 'Key-person coverage, buy-sell funding, and executive-benefit insurance strategies.',
  },
  {
    icon: <Landmark size={32} aria-hidden="true" />,
    title: 'Local Organizations',
    description: 'Key-person and continuity-focused insurance education for organizations with insurable business needs.',
  },
  {
    icon: <HeartPulse size={32} aria-hidden="true" />,
    title: 'Healthcare Workers',
    description: 'Life insurance, eligible living-benefit riders, and retirement-income options for shift workers.',
  },
  {
    icon: <Wrench size={32} aria-hidden="true" />,
    title: 'Trade Workers',
    description: 'Term coverage, final-expense planning, mortgage protection, and household income protection.',
  },
]

function CtaButtons({ centered = false, large = false }: { centered?: boolean; large?: boolean }) {
  const paddingClass = large ? 'px-8 py-3' : 'px-4 py-2'
  const textClass = large ? 'text-base' : 'text-sm'

  return (
    <div className={`flex flex-wrap gap-4 ${centered ? 'justify-center' : ''}`}>
      <a
        href={BRAND.bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-md font-bold no-underline transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-[#0E1A2B] bg-[#C9A24D] text-[#0E1A2B] ${paddingClass} ${textClass}`}
      >
        Book Free Consultation
      </a>
      <a
        href={BRAND.ethosUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`rounded-md font-bold no-underline transition-all hover:bg-[#C9A24D]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C9A24D] focus-visible:ring-offset-[#0E1A2B] bg-transparent text-white border-2 border-[#C9A24D] ${paddingClass} ${textClass}`}
      >
        Get Instant Quote
      </a>
    </div>
  )
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="bg-white rounded-xl shadow-md border border-black/5 overflow-hidden">
      <div className="p-6" style={{ background: NAVY }}>
        <div className="flex items-center gap-4 mb-3">
          <span className="font-extrabold text-lg" style={{ color: GOLD }}>{service.number}</span>
          <span className="text-2xl text-white" aria-hidden="true">{service.icon}</span>
        </div>
        <h3 className="text-white text-xl font-semibold mb-1">{service.title}</h3>
        <p className="text-sm" style={{ color: GOLD_LIGHT }}>Best for: {service.who}</p>
      </div>
      <div className="p-6">
        <p className="text-gray-700 leading-relaxed mb-4 text-sm">{service.summary}</p>
        <ul className="space-y-2">
          {service.points.map((point) => (
            <li key={point} className="flex gap-3 text-gray-700 text-sm">
              <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: GOLD }} aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="px-6 pb-6 flex flex-col gap-2">
        <Link href="/legacy-checkup" className="block w-full text-center rounded-md font-bold no-underline transition-all hover:brightness-110 px-4 py-2 text-sm bg-[#C9A24D] text-[#0E1A2B]" data-track-event="legacy_checkup_started">
          Start Legacy Checkup →
        </Link>
        {service.learnMoreHref && (
          <Link href={gbpServiceUrl(service.learnMoreHref)} className="block w-full text-center rounded-md font-bold no-underline transition-all hover:brightness-110 px-4 py-2 text-sm border border-[#C9A24D] text-[#C9A24D] bg-transparent">
            Learn more
          </Link>
        )}
      </div>
    </article>
  )
}

function ClientSegmentCard({ segment }: { segment: ClientSegment }) {
  return (
    <article className="rounded-xl p-6 border border-white/10 hover:border-[#C9A24D]/50 transition-all" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div className="mb-4" style={{ color: GOLD }} aria-hidden="true">{segment.icon}</div>
      <h3 className="text-white font-semibold text-lg mb-2">{segment.title}</h3>
      <p className="text-white/65 text-sm leading-relaxed">{segment.description}</p>
    </article>
  )
}

export default function ServicesPage() {
  return (
    <>
      <SiteHeader currentPath="/services" navLinks={DEFAULT_NAV_LINKS} />
      <main className="font-sans">
        <section className="text-center text-white py-16" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a2942 100%)` }}>
          <div className="max-w-3xl mx-auto px-5">
            <p className="text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: GOLD_LIGHT }}>What We Do</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight">
              Insurance Strategies to<br /><span style={{ color: GOLD_LIGHT }}>Protect Income, Assets &amp; Legacy</span>
            </h1>
            <p className="text-white/85 text-lg leading-relaxed mb-8">
              As an independent insurance broker, I compare available insurance options around your family situation, protection needs, budget, and goals — without a captive-company product quota.
            </p>
            <CtaButtons centered large />
          </div>
        </section>

        <section className="py-16 bg-gray-100" aria-labelledby="services-heading">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-10">
              <h2 id="services-heading" className="text-3xl md:text-4xl font-bold text-gray-900">Services</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service) => <ServiceCard key={service.number} service={service} />)}
            </div>
          </div>
        </section>

        <section className="py-16" style={{ background: NAVY }} aria-labelledby="who-we-serve-heading">
          <div className="max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD_LIGHT }}>Who We Serve</p>
              <h2 id="who-we-serve-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
                Built for the Communities<br /><span style={{ color: GOLD_LIGHT }}>That Built Central Pennsylvania</span>
              </h2>
              <p className="text-white/75 text-lg max-w-2xl mx-auto">
                Every protection review starts with where you are in life, who depends on you, what you already have, and what risk you are trying to address.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientSegments.map((segment) => <ClientSegmentCard key={segment.title} segment={segment} />)}
            </div>
          </div>
        </section>

        <section className="py-16 text-center text-white" style={{ background: `linear-gradient(135deg, #1a2942 0%, ${NAVY} 100%)` }}>
          <div className="max-w-2xl mx-auto px-5">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD_LIGHT }}>Ready to Start?</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Build Protection<br /><span style={{ color: GOLD_LIGHT }}>Around Your Life</span>
            </h2>
            <p className="text-white/75 text-lg mb-8 leading-relaxed">
              No pressure. No captive-company product quota. Just insurance education, comparison, and a clear explanation of policy terms and tradeoffs.
            </p>
            <CtaButtons centered large />
          </div>
        </section>
      </main>

      <section className="bg-[#060D1B] border-t border-white/5 py-8 px-5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-white/45 leading-relaxed">
            <strong className="text-white/60 font-semibold">Important Disclosures:</strong>{' '}
            Fixed indexed annuities and indexed life insurance are insurance products, not securities or direct investments in a market index. They are not FDIC-insured and are not deposits or obligations of a bank. Product guarantees, including death benefits and lifetime-income features, are subject to contract terms and the claims-paying ability of the issuing insurance company. Indexed-product crediting may be limited by caps, participation rates, spreads, crediting periods, and other provisions. A 0% index-crediting floor means a negative index period does not itself create a negative index credit; policy or contract charges, loans, withdrawals, and surrender charges may still reduce value. Tax treatment depends on current law, policy structure, account type, and individual circumstances. Policy loans and withdrawals reduce cash value and death benefits and can create tax consequences. FAFSA and estate-planning rules can change. Latimore Life &amp; Legacy LLC provides insurance education and licensed insurance services, not legal, tax, securities, or investment advice. Consult qualified legal, tax, plan-administration, or other professionals when those issues apply.
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
