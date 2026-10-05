import { BRAND } from '@/lib/brand'

/**
 * Neutral, educational guide content keyed by the checkup's priority areas.
 * Everything here is framed as topics to discuss with a licensed professional.
 * It is not a recommendation, a score, or a projection of any outcome.
 */

export const GUIDE_PRIORITIES = [
  'family',
  'mortgage',
  'finalExpense',
  'retirement',
  'business',
  'children',
  'estate',
] as const

export type GuidePriority = (typeof GUIDE_PRIORITIES)[number]

export type GuideSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export type GuideInput = {
  firstName?: string
  priorities: GuidePriority[]
  county?: string
}

export type GuideDocument = {
  title: string
  subtitle: string
  filename: string
  sections: GuideSection[]
  footer: string
  bookingUrl: string
}

type PriorityContent = {
  label: string
  intro: string
  topics: string[]
  questions: string[]
}

const PRIORITY_CONTENT: Record<GuidePriority, PriorityContent> = {
  family: {
    label: 'Family protection',
    intro:
      'Life insurance may help provide funds to people who depend on you, depending on policy design and subject to carrier terms. The topics below are common starting points for a conversation with a licensed professional.',
    topics: [
      'Who relies on your income or your household contributions, and for roughly how long.',
      'How term and permanent policy types differ in structure, cost, and duration.',
      'Whether coverage through an employer may change if your job changes.',
      'How beneficiary designations are set up and when they were last reviewed.',
    ],
    questions: [
      'Which policy types may fit the situation I describe, and what are the trade-offs?',
      'What underwriting information might a carrier request?',
      'How are premiums structured, and what may cause them to change?',
    ],
  },
  mortgage: {
    label: 'Mortgage and debt',
    intro:
      'Some households look at coverage designed to help with a mortgage or other debts. Options, availability, and pricing vary by carrier and are subject to underwriting.',
    topics: [
      'The remaining balance, term, and payment of any mortgage or loans.',
      'The difference between a policy that pays a family-selected beneficiary and one that pays a lender.',
      'How a level benefit compares with a benefit that may decrease over time.',
      'How the length of a policy term may compare with the length of the loan.',
    ],
    questions: [
      'How do the available designs differ in who receives the benefit and how it may be used?',
      'What happens to coverage if the loan is refinanced or paid off?',
      'What conditions or exclusions may apply under a given carrier contract?',
    ],
  },
  finalExpense: {
    label: 'Final expense planning',
    intro:
      'Final expense planning may involve smaller whole life policies intended to help with end-of-life costs. Features, waiting periods, and eligibility vary by carrier and policy.',
    topics: [
      'Which costs a family may want to plan for, such as services, burial or cremation, and outstanding bills.',
      'Whether a policy may include a waiting period before the full benefit is available.',
      'How premiums are set and whether they may change over time, depending on policy design.',
      'Who should know where policy documents are kept.',
    ],
    questions: [
      'How does the application process work and what questions may be asked?',
      'What may happen to the benefit during any waiting period?',
      'How does this approach compare with setting funds aside in other ways?',
    ],
  },
  retirement: {
    label: 'Retirement income planning',
    intro:
      'Retirement planning often involves several accounts and rules working together. Insurance and annuity products have features and limitations that are defined in each contract and may not suit every situation.',
    topics: [
      'Which retirement accounts you already have and how access rules may apply to each.',
      'How different product types handle market exposure, fees, and surrender terms.',
      'How indexed products work, including caps, participation rates, and floors, which are set by the carrier and may change.',
      'How the timing of withdrawals may interact with taxes, which a qualified tax professional can address.',
    ],
    questions: [
      'What are the fees, charges, and surrender periods in a product I am considering?',
      'Which contract terms are set by the carrier and may be adjusted?',
      'Which parts of my situation should I review with a tax professional?',
    ],
  },
  business: {
    label: 'Business owner planning',
    intro:
      'Business owners may have additional topics to consider, such as continuity and ownership transitions. These depend on the business structure and are usually reviewed together with an attorney and an accountant.',
    topics: [
      'How the business might continue if an owner or key person is no longer able to work.',
      'How a buy-sell agreement may be funded, depending on its design.',
      'Whether key person coverage is a topic worth exploring for your business.',
      'How employee or owner benefits may be structured, subject to applicable rules.',
    ],
    questions: [
      'Which structures are commonly discussed for a business like mine?',
      'Which items should I review with my attorney or accountant first?',
      'How may ownership or policy changes affect existing agreements?',
    ],
  },
  children: {
    label: 'Planning for children',
    intro:
      'Some families look at policies on children or at ways to plan for a child\'s future needs. Policy features, costs, and cash value (where applicable) vary by carrier and design, and are not guaranteed unless stated in the contract.',
    topics: [
      'What goals a family may have, such as protecting future insurability or supporting a long-term plan.',
      'How the cost of a policy on a child may compare with the same type of policy later in life.',
      'How ownership and beneficiary choices may be set up and changed over time.',
      'How a policy may fit alongside other ways the family already plans for education or savings.',
    ],
    questions: [
      'How does cash value, if any, work in the policy being discussed?',
      'Who owns the policy and what may change as the child grows?',
      'What contract terms apply, and which are not guaranteed?',
    ],
  },
  estate: {
    label: 'Estate planning',
    intro:
      'Estate planning documents and insurance work in different ways. A policy pays according to its beneficiary designations, while documents such as wills, trusts, and powers of attorney are typically prepared by an attorney.',
    topics: [
      'Which documents you already have and when they were last reviewed.',
      'How beneficiary designations on policies and accounts may relate to your wishes.',
      'How health care directives and powers of attorney are commonly used.',
      'How an attorney may help you coordinate documents with the rest of your plan.',
    ],
    questions: [
      'Which items belong with an attorney and which relate to insurance?',
      'How may beneficiary designations differ from what a will says?',
      'What information should I gather before meeting an attorney?',
    ],
  },
}

const GENERAL_PREPARATION = [
  'A list of any existing life insurance, annuity, or retirement account statements.',
  'Names of the people and organizations you would want to be listed as beneficiaries.',
  'A rough list of regular household obligations such as housing, loans, and care costs.',
  'Questions or concerns you would like to talk through.',
]

export function absoluteBookingUrl(): string {
  try {
    return new URL(BRAND.bookingUrl, BRAND.baseUrl).toString()
  } catch {
    return `${BRAND.baseUrl.replace(/\/+$/, '')}${BRAND.bookingUrl}`
  }
}

export const DISCLOSURE_TEXT = [
  `${BRAND.advisor} is licensed in the Commonwealth of Pennsylvania (PA DOI License #${BRAND.paLicense}, NIPR #${BRAND.nipr}). Insurance products are offered through ${BRAND.fullName}, an independent insurance agency. ${BRAND.affiliation}.`,
  'This guide is for general education only. It is not a recommendation, a quote, an illustration, or an offer of any product. It is not tax or investment direction and is not a substitute for an attorney; please consult a qualified tax professional or attorney about your situation.',
  'Insurance products and features vary by carrier, product, and state, and benefits are not guaranteed unless stated in the policy contract. Availability and pricing are subject to underwriting and carrier terms. Any suitability review takes place in a conversation with a licensed professional.',
]

function cleanName(name?: string): string {
  return (name ?? '').replace(/[^\p{L}\s'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60)
}

export function buildGuide(input: GuideInput): GuideDocument {
  const name = cleanName(input.firstName)
  const priorities = Array.from(new Set(input.priorities)).filter((p) => p in PRIORITY_CONTENT)
  const selected = priorities.length ? priorities : (['family'] as GuidePriority[])
  const bookingUrl = absoluteBookingUrl()

  const sections: GuideSection[] = []

  sections.push({
    heading: name ? `Hello, ${name}` : 'Hello',
    paragraphs: [
      'Thank you for completing the Legacy Checkup. This guide gathers general educational topics connected to the areas you selected. It is meant to help you prepare questions for a conversation with a licensed professional.',
      'The guide does not evaluate your situation, assign a rating, or suggest that any product is right for you.',
      input.county
        ? `You mentioned ${input.county} County. Product availability and rules may vary by state and carrier.`
        : '',
    ].filter(Boolean),
  })

  for (const key of selected) {
    const c = PRIORITY_CONTENT[key]
    sections.push({ heading: c.label, paragraphs: [c.intro] })
    sections.push({ heading: `${c.label}: topics to discuss`, bullets: c.topics })
    sections.push({ heading: `${c.label}: questions you may want to ask`, bullets: c.questions })
  }

  sections.push({ heading: 'Helpful items to gather before a conversation', bullets: GENERAL_PREPARATION })

  sections.push({
    heading: 'Next step',
    paragraphs: [
      `If you would like to talk through any of these topics, you can schedule a free consultation at ${bookingUrl} or call ${BRAND.phone}.`,
      `${BRAND.advisor}`,
    ],
  })

  sections.push({ heading: 'Important disclosures', paragraphs: DISCLOSURE_TEXT })

  const slug = selected.join('-').toLowerCase()
  return {
    title: 'Your Legacy Checkup Education Guide',
    subtitle: `${BRAND.fullName}`,
    filename: `legacy-checkup-guide-${slug}.pdf`,
    sections,
    footer: `${BRAND.fullName} | ${BRAND.phone} | PA License #${BRAND.paLicense} | ${BRAND.hashtag}`,
    bookingUrl,
  }
}

export function guideToPlainText(doc: GuideDocument): string {
  const parts: string[] = [doc.title, doc.subtitle]
  for (const s of doc.sections) {
    parts.push(s.heading)
    s.paragraphs?.forEach((p) => parts.push(p))
    s.bullets?.forEach((b) => parts.push(`- ${b}`))
  }
  parts.push(doc.footer)
  return parts.join('\n')
}
