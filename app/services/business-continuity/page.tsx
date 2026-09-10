import type { Metadata } from 'next'
import { ServiceLandingPage, type ServiceLandingContent } from '../_components/landing-template'

export const metadata: Metadata = {
  title: 'Key Person & Business Continuity Planning | Latimore Life & Legacy',
  description:
    'Review key-person life insurance, buy-sell funding, and executive-benefit insurance strategies for Pennsylvania businesses, with legal and tax coordination where needed.',
}

const content: ServiceLandingContent = {
  path: '/services/business-continuity',
  eyebrow: 'Business Protection',
  heroTitle: (
    <>
      Key Person &amp; Business
      <br />
      <span style={{ color: '#E5C882' }}>Continuity Planning</span>
    </>
  ),
  heroSubtitle:
    'Insurance-based continuity strategies can provide business liquidity when the death of a covered owner or key employee creates a financial disruption.',
  solvesIntro:
    'The death or loss of a key owner or employee can create revenue, succession, debt, and staffing challenges. Key-person and business-owned life insurance may provide liquidity to support a transition, while buy-sell and executive-benefit arrangements should be coordinated with qualified legal and tax professionals.',
  solvesColumns: [
    {
      heading: 'Business Continuity Risks',
      items: [
        'Revenue or client disruption after the death of a key owner or employee',
        'Debt, recruiting, or operating expenses that continue during a transition',
        'Ownership-transition obligations that are not adequately funded',
        'Retention needs for key employees where an executive-benefit arrangement may be appropriate',
      ],
    },
    {
      heading: 'Insurance-Based Continuity Options',
      items: [
        'Key-person life insurance may provide liquidity to the business after a covered death',
        'Executive Bonus arrangements may use life insurance as part of a compensation strategy, subject to tax and compensation rules',
        'Split-dollar arrangements can allocate policy rights and costs under a formal legal and tax structure',
        'Life insurance may help fund obligations under a properly drafted buy-sell agreement',
      ],
    },
  ],
  whoIntro: 'Business-protection reviews may be useful for:',
  whoCards: [
    {
      title: 'Closely Held Businesses',
      description:
        'Partners and family-owned firms evaluating key-person exposure, succession funding, or buy-sell insurance needs.',
    },
    {
      title: 'Firms with Key Personnel',
      description:
        'Businesses that depend heavily on specialized employees, rainmakers, founders, or other people whose loss could materially affect operations.',
    },
    {
      title: 'Growth-Minded Owners',
      description:
        'Employers exploring insurance-based executive benefits with appropriate legal, tax, and compensation-plan coordination.',
    },
  ],
  howItWorks: [
    {
      title: 'Business Risk Review',
      description:
        'We identify the people and financial obligations whose loss could create a measurable insurance need for the business.',
    },
    {
      title: 'Insurance Comparison',
      description:
        'Where appropriate, we compare available key-person, buy-sell funding, or executive-benefit insurance options and explain policy terms and tradeoffs.',
    },
    {
      title: 'Professional Coordination',
      description:
        'We coordinate insurance implementation with your attorney, CPA, plan administrator, or other qualified professional when legal or tax structuring is involved.',
    },
  ],
  faqs: [
    {
      question: 'Who owns and pays for a Key Person life insurance policy?',
      answer:
        'In a common key-person structure, the business applies for, owns, and pays premiums on coverage for an insured key person and is the beneficiary. Insurable-interest, notice-and-consent, tax, and employer-owned life-insurance requirements must be satisfied. Death-benefit tax treatment depends on the structure and applicable law.',
    },
    {
      question: 'What is a Section 162 Executive Bonus Plan?',
      answer:
        'An executive-bonus arrangement may allow an employer to pay compensation that the employee uses toward an individually owned life-insurance policy. Whether the employer may deduct the compensation depends on applicable tax rules, including whether compensation is reasonable and properly reported; consult a qualified tax professional.',
    },
    {
      question: 'How are Split Dollar arrangements structured?',
      answer:
        'Split-dollar arrangements allocate policy benefits, premiums, and rights between parties under a formal agreement. Ownership, tax treatment, imputed benefits, exit provisions, and policy economics are structure-specific and should be reviewed with qualified legal and tax professionals.',
    },
    {
      question: 'Does this disrupt our ongoing corporate accounting?',
      answer:
        'Accounting, reporting, and administrative requirements depend on the strategy selected. We explain the insurance mechanics and coordinate with your accounting, legal, or tax professionals before implementation where appropriate.',
    },
  ],
  closingTitle: (
    <>
      Protect the People
      <br />
      <span style={{ color: '#E5C882' }}>Your Business Depends On</span>
    </>
  ),
  closingSubtitle:
    'No pressure. No product quotas. Just an insurance-focused conversation about key-person risk, business liquidity, and continuity needs.',
}

export default function BusinessContinuityPage() {
  return <ServiceLandingPage content={content} />
}
