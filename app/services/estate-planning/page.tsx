import type { Metadata } from 'next'
import { ServiceLandingPage, type ServiceLandingContent } from '../_components/landing-template'

export const metadata: Metadata = {
  title: 'Legacy & Estate Planning | Latimore Life & Legacy',
  description:
    'Protect your estate from probate, taxes, and forced liquidation with tax-free wealth transfer strategies, Indexed Universal Life, and estate equalization planning.',
}

const content: ServiceLandingContent = {
  path: '/services/estate-planning',
  eyebrow: 'Wealth Transfer',
  heroTitle: (
    <>
      Legacy &amp;
      <br />
      <span style={{ color: '#E5C882' }}>Estate Planning</span>
    </>
  ),
  heroSubtitle:
    'Strategic integration planning that ensures your hard-earned wealth transfers directly to your family — exactly as you intend.',
  solvesIntro:
    'Building an estate is a massive achievement — but failing to protect it can leave your legacy exposed to hefty taxes, long probate battles, and state interference. Our strategic integration planning ensures your hard-earned wealth transfers directly to your family exactly as you want.',
  solvesColumns: [
    {
      heading: 'Unplanned Estate Pitfalls',
      items: [
        "Months or years lost in public probate court, freezing your family's access to assets",
        "Heavy estate taxes and transfer levies shrinking your children's inheritance",
        'Forced liquidation of family properties or family business stakes to settle estate debts',
        'Mismatched or out-of-date beneficiary designations that conflict with your current wishes',
      ],
    },
    {
      heading: 'Protected Legacy Architecture',
      items: [
        'Instant, private wealth transfer using tax-free insurance death benefits',
        'Advanced cash accumulation models like Indexed Universal Life (IUL) with zero market downside',
        'Strategic estate equalization structures that protect and preserve long-term family harmony',
        'Coordination with your legal team and CPA to legally shield assets from unnecessary tax erosion',
      ],
    },
  ],
  whoIntro: 'Legacy preservation blueprints are built for:',
  whoCards: [
    {
      title: 'Generational Wealth Planners',
      description: 'Parents and grandparents looking to guarantee a clean financial legacy for their descendants.',
    },
    {
      title: 'Asset Protection Clients',
      description:
        'High-earning individuals who want to scale their wealth in tax-advantaged environments while keeping assets private.',
    },
    {
      title: 'Seniors Nearing Transition',
      description:
        "Pennsylvania residents wanting to clarify their wealth transfer plan and remove final expense burdens from their heirs.",
    },
  ],
  howItWorks: [
    {
      title: 'Legacy Assessment',
      description:
        'We review your asset inventory, active coverage details, and transfer goals alongside your legal frameworks.',
    },
    {
      title: 'Tax-Efficient Strategy',
      description:
        'We build a strategy around powerful vehicles like Indexed Universal Life or guaranteed permanent options to optimize wealth transfer.',
    },
    {
      title: 'Systemic Integration',
      description:
        'We align your beneficiary listings and policy allocations with your overall estate plan for a smooth, private transfer.',
    },
  ],
  faqs: [
    {
      question: 'How does permanent life insurance help bypass the PA probate process?',
      answer:
        'Life insurance death benefits pass directly to your designated beneficiaries contractually, bypassing the public probate court system entirely.',
    },
    {
      question: 'What role do Indexed Universal Life (IUL) plans play in wealth transfer?',
      answer:
        'An IUL policy allows for tax-deferred cash accumulation tied to market indices with a 0% floor to protect against losses, while building an enhanced, tax-free legacy benefit.',
    },
    {
      question: 'What is estate equalization?',
      answer:
        'If you leave a physical asset (like a business or real estate) to one child, a life insurance policy can provide an equal financial legacy for your other heirs.',
    },
    {
      question: 'Do you draft wills or create revocable living trusts directly?',
      answer:
        "We do not provide direct legal or tax advice. Instead, we act as specialized insurance consultants, matching the right products to support your attorney's estate planning goals.",
    },
  ],
  closingTitle: (
    <>
      Protect the Legacy
      <br />
      <span style={{ color: '#E5C882' }}>You Worked to Build</span>
    </>
  ),
  closingSubtitle:
    'No pressure. No product quotas. Just an honest conversation about how your wealth transfers to the people you love.',
}

export default function EstatePlanningPage() {
  return <ServiceLandingPage content={content} />
}
