import type { Metadata } from 'next'
import { ServiceLandingPage, type ServiceLandingContent } from '../_components/landing-template'

export const metadata: Metadata = {
  title: 'Strategic Debt Action Plan | Latimore Life & Legacy',
  description:
    'A free Financial Home Makeover that audits your debt, insurance, and cash flow — then builds a Strategic Debt Action Plan to redirect toxic interest into lasting wealth.',
}

const content: ServiceLandingContent = {
  path: '/services/debt-strategy',
  eyebrow: 'Cash Flow & Debt Elimination',
  heroTitle: (
    <>
      Strategic Debt
      <br />
      <span style={{ color: '#E5C882' }}>Action Plan</span>
    </>
  ),
  heroSubtitle:
    'A free Financial Home Makeover that turns high-interest debt into the foundation of your long-term wealth.',
  solvesIntro:
    'High-interest debt acts as an anchor holding back long-term wealth accumulation. Our Strategic Debt Action Plan uses smart cash flow mechanics and specific insurance tools to systematically redirect toxic interest margins back into your personal household.',
  solvesColumns: [
    {
      heading: 'Traditional Debt Pitfalls',
      items: [
        'High compounding interest on credit cards and medical accounts eating your savings',
        'Paying recurring bank charges, maintenance minimums, and hidden transaction fees',
        'Making minimum payments that take decades to pay off your baseline principal',
        'Fragmented financial products that conflict with your long-term protection goals',
      ],
    },
    {
      heading: 'Strategic Debt Action Layout',
      items: [
        'Consolidating liabilities via customized financial tools carrying low 0–5% baseline loan rates',
        'Isolating gaps, overlapping products, and inefficiencies through a deep policy checkup',
        'Acquiring early access to tax-advantaged cash value accounts to clear commercial debt',
        'Turning toxic outlays into compounding retirement assets you own completely',
      ],
    },
  ],
  whoIntro: 'A custom Financial Makeover is ideal for:',
  whoCards: [
    {
      title: 'Over-Leveraged Households',
      description:
        'Families working hard to balance standard living expenses against aggressive card structures or high consumer balances.',
    },
    {
      title: 'Fragmented Planners',
      description:
        'Individuals with disconnected accounts scattered across old companies who need to maximize efficiency.',
    },
    {
      title: 'Wealth-Building Trainees',
      description: 'Anyone who wants an honest financial blueprint to eliminate debt and stop wealth erosion.',
    },
  ],
  howItWorks: [
    {
      title: 'Financial Home Makeover',
      description:
        'We audit your existing outlays, open debt positions, and mismatched insurance accounts to find wasted capital leaks.',
    },
    {
      title: 'Restructuring Blueprint',
      description:
        'We build a prioritized Debt Action Plan that shifts high-interest lines into efficient wealth structures.',
    },
    {
      title: 'Legacy Redirection',
      description:
        'We clean up your cash flow to accelerate debt elimination, protecting your family and building lasting savings.',
    },
  ],
  faqs: [
    {
      question: 'What exactly is a Financial Home Makeover Analysis?',
      answer:
        'It is a comprehensive review of your active coverage, savings accounts, and payment lines to identify overlaps and clear up your cash flow.',
    },
    {
      question: 'How do permanent insurance products interact with debt management?',
      answer:
        'Certain permanent life insurance policies accumulate tax-advantaged cash value that can be accessed early via low-interest policy loans to pay off high-interest debt.',
    },
    {
      question: 'Is this a debt settlement program that hurts my credit rating?',
      answer:
        'No, this is a strategic asset reorganization and acceleration approach. We work to improve your overall cash flow structure without damaging your credit profile.',
    },
    {
      question: 'What are the ongoing costs for this audit analysis?',
      answer:
        'Our initial Financial Home Makeover Analysis is provided as a free, educational service to help you find clarity with zero long-term pressure.',
    },
  ],
  closingTitle: (
    <>
      Turn Your Debt
      <br />
      <span style={{ color: '#E5C882' }}>Into Your Legacy</span>
    </>
  ),
  closingSubtitle:
    'No pressure. No product quotas. Just an honest conversation about where your money is going and where it could be going instead.',
}

export default function DebtStrategyPage() {
  return <ServiceLandingPage content={content} />
}
