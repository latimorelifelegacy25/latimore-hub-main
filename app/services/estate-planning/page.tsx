import type { Metadata } from 'next'
import { ServiceLandingPage, type ServiceLandingContent } from '../_components/landing-template'

export const metadata: Metadata = {
  title: 'Legacy & Estate Planning Coordination | Latimore Life & Legacy',
  description:
    'Coordinate life insurance and beneficiary planning with attorney-prepared estate documents. Review wealth-transfer, liquidity, and legacy-protection needs in Pennsylvania.',
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
    'Coordinate life insurance and beneficiary planning with your attorney-prepared estate documents so the insurance structure supports your intended legacy.',
  solvesIntro:
    'Estate planning involves legal, tax, beneficiary, ownership, and liquidity decisions. Latimore Life & Legacy focuses on the insurance component — helping you review coverage and beneficiary structure while coordinating with qualified legal and tax professionals for wills, trusts, powers of attorney, and tax matters.',
  solvesColumns: [
    {
      heading: 'Common Estate-Planning Gaps',
      items: [
        'Out-of-date beneficiary designations that no longer match current family circumstances',
        'Insufficient liquidity for debts, final expenses, taxes, or business-transition obligations',
        'Life-insurance ownership or beneficiary structures that have not been reviewed with the broader estate plan',
        'Legal documents and insurance policies that were created at different times and have not been coordinated',
      ],
    },
    {
      heading: 'Insurance & Legacy Coordination',
      items: [
        'Life-insurance death benefits are generally income-tax-free under current federal law, subject to individual circumstances',
        'Permanent life insurance may build tax-deferred cash value; indexed crediting, charges, and guarantees depend on policy terms',
        'Insurance can provide liquidity or help support estate-equalization goals when properly structured',
        'Coordination with your attorney and tax professional on ownership, beneficiary, probate, and tax questions',
      ],
    },
  ],
  whoIntro: 'Insurance-based legacy coordination may be useful for:',
  whoCards: [
    {
      title: 'Families Planning Wealth Transfer',
      description: 'Parents and grandparents who want life-insurance coverage and beneficiary designations aligned with their broader estate plan.',
    },
    {
      title: 'Business & Property Owners',
      description:
        'Individuals with business interests, real estate, or other assets that may create liquidity or equalization needs at death.',
    },
    {
      title: 'Families Reviewing Final Wishes',
      description:
        'Pennsylvania residents who want to review insurance beneficiaries, coverage, final-expense needs, and attorney coordination.',
    },
  ],
  howItWorks: [
    {
      title: 'Insurance & Beneficiary Review',
      description:
        'We review your existing life-insurance coverage, beneficiary designations, ownership, and stated legacy goals within the scope of licensed insurance services.',
    },
    {
      title: 'Protection & Liquidity Options',
      description:
        'Where appropriate, we compare permanent or term life-insurance options that may support death-benefit, liquidity, or wealth-transfer objectives.',
    },
    {
      title: 'Professional Coordination',
      description:
        'We identify items that should be coordinated with your attorney, CPA, or other qualified professional before legal or tax decisions are made.',
    },
  ],
  faqs: [
    {
      question: 'Can life insurance pass outside the Pennsylvania probate process?',
      answer:
        'Life-insurance proceeds paid to a valid named beneficiary generally pass by contract rather than through the insured’s probate estate. Probate, estate inclusion, creditor, tax, and beneficiary issues depend on ownership and individual circumstances, so legal questions should be reviewed with an attorney.',
    },
    {
      question: 'What role can Indexed Universal Life (IUL) play in wealth transfer?',
      answer:
        'An IUL is permanent life insurance that may build tax-deferred cash value through an index-linked crediting formula. A 0% index-crediting floor prevents a negative credit solely from index performance, but policy charges, loans, withdrawals, and other factors can reduce value. Death-benefit and tax treatment depend on policy status and individual circumstances.',
    },
    {
      question: 'What is estate equalization?',
      answer:
        'In some estate plans, life insurance can provide liquidity for one or more beneficiaries when other heirs receive business interests, real estate, or other non-cash assets. The legal structure and fairness objectives should be coordinated with qualified estate-planning counsel.',
    },
    {
      question: 'Do you draft wills or create revocable living trusts directly?',
      answer:
        'No. Latimore Life & Legacy LLC provides licensed insurance services and insurance education. We do not draft wills or trusts or provide legal or tax advice; we coordinate the insurance component with your qualified attorney and tax professional.',
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
    'No pressure. No product quotas. Just an insurance-focused conversation about protection, beneficiaries, liquidity, and coordination with your estate-planning professionals.',
}

export default function EstatePlanningPage() {
  return <ServiceLandingPage content={content} />
}
