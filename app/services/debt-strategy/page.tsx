import type { Metadata } from 'next'
import { ServiceLandingPage, type ServiceLandingContent } from '../_components/landing-template'

export const metadata: Metadata = {
  title: 'Debt Education & Cash-Flow Review | Latimore Life & Legacy',
  description:
    'Insurance-focused review of debt pressure, cash flow, and existing coverage. Understand protection priorities and policy-loan mechanics without debt-settlement or credit-repair promises.',
}

const content: ServiceLandingContent = {
  path: '/services/debt-strategy',
  eyebrow: 'Cash Flow & Protection Review',
  heroTitle: (
    <>
      Debt &amp; Cash-Flow
      <br />
      <span style={{ color: '#E5C882' }}>Protection Review</span>
    </>
  ),
  heroSubtitle:
    'An education-first review of how debt obligations interact with emergency savings and insurance protection — without promising debt elimination or credit outcomes.',
  solvesIntro:
    'High-interest debt can strain household cash flow and make it harder to maintain emergency reserves and essential insurance coverage. Latimore Life & Legacy reviews the insurance side of that equation: protection gaps, existing policy features, and the potential consequences of loans or withdrawals. We do not provide debt settlement, credit repair, lending, or investment advice.',
  solvesColumns: [
    {
      heading: 'Common Cash-Flow Pressure Points',
      items: [
        'High-interest consumer debt reducing the amount available for emergency savings and protection',
        'Minimum-payment obligations that limit monthly financial flexibility',
        'Insufficient emergency reserves creating greater dependence on credit after an unexpected expense',
        'Insurance coverage or premiums that no longer fit the household budget or current protection need',
      ],
    },
    {
      heading: 'Insurance & Protection Review',
      items: [
        'Prioritize essential household protection and emergency-reserve needs before considering additional insurance funding',
        'Review existing life-insurance coverage, beneficiaries, premiums, and available policy features',
        'If an existing permanent policy has cash value, explain how policy loans or withdrawals work and what they can cost',
        'Identify debt, tax, legal, or credit questions that should be taken to the appropriate qualified professional',
      ],
    },
  ],
  whoIntro: 'A debt and protection review may be useful for:',
  whoCards: [
    {
      title: 'Households Under Debt Pressure',
      description:
        'Families balancing debt payments, emergency savings, and the need to keep essential life-insurance protection affordable.',
    },
    {
      title: 'Permanent Policyholders',
      description:
        'Clients who already own cash-value life insurance and want to understand policy-loan, withdrawal, interest, and lapse consequences before using policy value.',
    },
    {
      title: 'Families Building a Protection Base',
      description:
        'Households that want a clear order of operations for emergency savings, debt priorities, and insurance protection without a product-first sales pitch.',
    },
  ],
  howItWorks: [
    {
      title: 'Household Protection Review',
      description:
        'We review your current life-insurance coverage, major household obligations, emergency-reserve position, and the people who depend on your income.',
    },
    {
      title: 'Policy Mechanics Education',
      description:
        'If you own permanent life insurance, we explain available cash value, loan interest, withdrawals, surrender provisions, and how accessing policy value can affect coverage.',
    },
    {
      title: 'Priorities & Professional Referrals',
      description:
        'We identify insurance actions within our licensed scope and flag debt-management, tax, credit, or legal issues that should be handled by the appropriate qualified professional.',
    },
  ],
  faqs: [
    {
      question: 'What is a Debt & Cash-Flow Protection Review?',
      answer:
        'It is a free educational review of your household obligations, existing life-insurance protection, emergency-reserve pressure, and any relevant policy features. It is not a debt-settlement, credit-repair, lending, or investment-management service.',
    },
    {
      question: 'Can permanent life insurance cash value be used to address debt?',
      answer:
        'Some permanent life-insurance policies allow loans or withdrawals from available cash value. That does not make borrowing automatically appropriate. Policy loans accrue interest, reduce available cash value and death benefits, and can create tax consequences if a policy lapses or is surrendered. Modified Endowment Contract rules may also change tax treatment.',
    },
    {
      question: 'Is this a debt settlement or credit repair program?',
      answer:
        'No. Latimore Life & Legacy LLC does not negotiate debts, promise reductions in balances or interest rates, repair credit, or guarantee credit-score outcomes. The service is limited to insurance education and protection planning within our licensed scope.',
    },
    {
      question: 'What does the review cost?',
      answer:
        'The initial educational insurance and protection review is free. If you later consider an insurance product, its premiums, charges, underwriting, policy terms, and suitability will be explained before you decide whether to apply.',
    },
  ],
  closingTitle: (
    <>
      Protect Cash Flow
      <br />
      <span style={{ color: '#E5C882' }}>While You Address Debt</span>
    </>
  ),
  closingSubtitle:
    'No pressure. No debt-settlement promises. Just a clear insurance-focused review of protection needs, existing policy features, and the tradeoffs that matter.',
}

export default function DebtStrategyPage() {
  return <ServiceLandingPage content={content} />
}
