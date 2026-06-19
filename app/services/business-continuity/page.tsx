import type { Metadata } from 'next'
import { ServiceLandingPage, type ServiceLandingContent } from '../_components/landing-template'

export const metadata: Metadata = {
  title: 'Key Person & Business Continuity Planning | Latimore Life & Legacy',
  description:
    'Protect your Pennsylvania business from the sudden loss of a key owner or employee with Key Person insurance, Executive Bonus Plans, and Split Dollar arrangements.',
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
    'A calculated financial safety net that keeps your business running — and your people protected — no matter what happens.',
  solvesIntro:
    'Unexpected events — such as an illness, the death of a key owner, or sudden operational disruptions — can bring a thriving Pennsylvania business to a grinding halt overnight. Key Person and Business Continuity planning provide a calculated financial safety net to protect your operations and personnel.',
  solvesColumns: [
    {
      heading: 'Unprotected Business Risks',
      items: [
        'Sudden revenue drops or lost client accounts if a key performer passes away',
        'Lenders demanding immediate repayment of corporate debts or lines of credit',
        'Forced liquidation or messy probate fights over ownership transitions',
        'Losing top executive talent to competitor firms with better benefits',
      ],
    },
    {
      heading: 'Structured Corporate Continuity',
      items: [
        'Tax-free cash benefits directly to the firm to recruit and train replacements',
        'Section 162 Executive Bonus Plans to tie down and reward top performers tax-deductibly',
        'Endorsement Split Dollar arrangements to split costs while retaining equity',
        'Guaranteed frameworks that keep operational momentum entirely secure',
      ],
    },
  ],
  whoIntro: 'Corporate strategies are custom-tailored for:',
  whoCards: [
    {
      title: 'Closely Held Businesses',
      description:
        'Partners and family-owned firms in PA that require clean succession pathways and buy-sell agreements.',
    },
    {
      title: 'Firms with Indispensable Personnel',
      description:
        'Companies reliant on specialized rainmakers, top developers, or founders whose absence stops revenue.',
    },
    {
      title: 'Growth-Minded Owners',
      description:
        'Employers wanting to implement tax-advantaged execution benefits without heavy administrative overhead.',
    },
  ],
  howItWorks: [
    {
      title: 'Vulnerability Audit',
      description:
        'We analyze your business agreements, isolate your most critical operational liabilities, and identify your key personnel.',
    },
    {
      title: 'Strategy Blueprinting',
      description:
        'We design a bespoke combination of Key Person structures, Split Dollar mechanics, or bonus packages matching your fiscal target.',
    },
    {
      title: 'Seamless Execution',
      description:
        'We set up your policy underwriting and work neatly alongside your legal counsel or CPA to integrate protections seamlessly.',
    },
  ],
  faqs: [
    {
      question: 'Who owns and pays for a Key Person life insurance policy?',
      answer:
        'The business entity itself acts as the policy applicant, payor, and primary beneficiary. If that critical individual passes away, the company receives the tax-free payout directly.',
    },
    {
      question: 'What is a Section 162 Executive Bonus Plan?',
      answer:
        'It is a strategy where an employer bonuses premium dollars to a selected employee, who then owns a permanent policy. The business deducts the bonus, and the employee accumulates asset equity.',
    },
    {
      question: 'How are Split Dollar arrangements structured?',
      answer:
        'An Endorsement Split Dollar arrangement allows an employer to share insurance costs and benefits with a key executive. The employer typically owns the policy and retains an interest in its cash value accumulation.',
    },
    {
      question: 'Does this disrupt our ongoing corporate accounting?',
      answer:
        'Not at all. These plans are chosen for their straightforward installation parameters, offering powerful executive tracking with very low upkeep friction.',
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
    'No pressure. No product quotas. Just an honest conversation about safeguarding your business and the people who make it run.',
}

export default function BusinessContinuityPage() {
  return <ServiceLandingPage content={content} />
}
