import { BRAND } from '@/lib/brand'

/**
 * Educational fill-in worksheets offered on the planning tool pages.
 * Copy is carrier-neutral and product-neutral. Nothing here is a quote,
 * a recommendation, or a projection of any outcome.
 */

export const WORKSHEET_IDS = ['family', 'retirement', 'legacy'] as const
export type WorksheetId = (typeof WORKSHEET_IDS)[number]

export type WorksheetBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'fields'; items: string[] }
  | { type: 'total'; label: string }
  | { type: 'checklist'; items: string[] }
  | { type: 'bullets'; items: string[] }
  | { type: 'notes'; label: string; lines: number }

export type WorksheetDocument = {
  id: WorksheetId
  title: string
  subtitle: string
  filename: string
  emailSubject: string
  blocks: WorksheetBlock[]
  sources: Array<[string, string]>
  footer: string
}

const FOOTER = `${BRAND.fullName} | PA DOI License #${BRAND.paLicense} | NIPR #${BRAND.nipr} | ${BRAND.phone}. For education only. Not legal, tax, or investment advice.`

const NAIC_SOURCE: [string, string] = [
  "NAIC Life Insurance Buyer's Guide",
  'https://content.naic.org/sites/default/files/publication-lig-lp-consumer-life.pdf',
]
const SSA_SOURCE: [string, string] = ['Social Security Administration: my Social Security', 'https://www.ssa.gov/myaccount']
const NFDA_SOURCE: [string, string] = [
  'NFDA General Price List Study release',
  'https://www.nfda.org/news/media-center/nfda-news-releases/id/4797',
]

const WORKSHEETS: Record<WorksheetId, WorksheetDocument> = {
  family: {
    id: 'family',
    title: 'Family Protection Worksheet',
    subtitle: 'Write down the numbers behind your protection gap',
    filename: 'Latimore-Family-Protection-Worksheet.pdf',
    emailSubject: 'Your Family Protection Worksheet',
    blocks: [
      {
        type: 'paragraph',
        text: 'Use this worksheet with the Family Protection Snapshot on our website. It helps you write down what your household would still need if an income disappeared, so you have a number to discuss instead of guessing. It is an educational estimate, not a quote or an application.',
      },
      { type: 'heading', text: 'Step 1. Income years' },
      { type: 'fields', items: ['Annual household income to replace', 'Number of years your family would need time to adjust'] },
      { type: 'total', label: 'Income to replace (income x years)' },
      { type: 'heading', text: 'Step 2. Housing' },
      { type: 'fields', items: ['Mortgage balance or remaining housing obligation', 'Monthly housing payment', 'Years remaining on the loan or lease'] },
      { type: 'heading', text: 'Step 3. Debt, childcare, education, and other' },
      { type: 'fields', items: ['Credit cards and personal loans', 'Auto loans', 'Student loans', 'Childcare costs you want covered', 'Education funding for children', 'Other obligations'] },
      { type: 'total', label: 'Total of Steps 2 and 3' },
      { type: 'heading', text: 'Step 4. Protection you already have' },
      { type: 'fields', items: ['Coverage through an employer (benefit amount)', 'Individual coverage you own (benefit amount)', 'Savings you have set aside for these needs'] },
      { type: 'total', label: 'Total existing protection' },
      { type: 'heading', text: 'Step 5. Your estimated gap' },
      { type: 'paragraph', text: 'Add Step 1 and the total of Steps 2 and 3. Subtract your existing protection. If the result is zero or below, you may not show a gap from these numbers, but it is still worth reviewing your assumptions.' },
      { type: 'total', label: 'Estimated protection gap' },
      { type: 'heading', text: 'Check these before you rely on your number' },
      {
        type: 'checklist',
        items: [
          'Confirm whether coverage through work stays with you if your job changes. Employer coverage is often less than a household needs.',
          'Confirm who is named as beneficiary on each policy and account, and when that was last reviewed.',
          'Note anyone who depends on you financially and for how long.',
          'List any coverage that is due to expire and the date.',
        ],
      },
      { type: 'heading', text: 'Questions and priorities for your consultation' },
      { type: 'notes', label: 'What matters most to my family right now', lines: 4 },
      { type: 'notes', label: 'Questions I want answered', lines: 4 },
    ],
    sources: [NAIC_SOURCE],
    footer: FOOTER,
  },
  retirement: {
    id: 'retirement',
    title: 'Retirement Income Gap Worksheet',
    subtitle: 'Turn a savings balance into a monthly paycheck',
    filename: 'Latimore-Retirement-Income-Gap-Worksheet.pdf',
    emailSubject: 'Your Retirement Income Gap Worksheet',
    blocks: [
      {
        type: 'paragraph',
        text: 'Use this worksheet with the Retirement Income Snapshot on our website. A retirement balance is useful, but the planning question is monthly: how much income you want, how much is already predictable, and what gap your remaining assets must support. This worksheet does not project investment performance or recommend a financial product.',
      },
      { type: 'heading', text: 'Step 1. Income you want each month' },
      { type: 'fields', items: ['Desired monthly retirement income', 'Age you plan to begin drawing income'] },
      { type: 'heading', text: 'Step 2. Predictable monthly income' },
      { type: 'paragraph', text: 'For your Social Security figure, use the estimate in your own my Social Security account rather than a guess. It is based on your earnings record.' },
      {
        type: 'fields',
        items: ['Your estimated Social Security benefit', 'Spouse or partner estimated Social Security benefit', 'Pension income', 'Other predictable monthly income (contractual or fixed sources)'],
      },
      { type: 'total', label: 'Total predictable monthly income' },
      { type: 'heading', text: 'Step 3. Your monthly gap' },
      { type: 'paragraph', text: 'Subtract your total predictable income from your desired monthly income. If the result is zero or below, the next question is whether those income sources continue as expected for a surviving spouse.' },
      { type: 'total', label: 'Estimated monthly income gap' },
      { type: 'heading', text: 'Step 4. Housing and fixed obligations' },
      { type: 'fields', items: ['Monthly housing payment', 'Years remaining on the mortgage, if any', 'Other fixed monthly obligations', 'Health care costs you expect to pay each month'] },
      { type: 'heading', text: 'Questions to answer before you retire' },
      {
        type: 'checklist',
        items: [
          'Which income sources continue, and at what amount, if one spouse passes away?',
          'Which sources are adjusted for inflation and which stay level?',
          'When does each source begin and is the start date flexible?',
          'How much of the gap would come from savings, and how long is that meant to last?',
        ],
      },
      { type: 'notes', label: 'My retirement priorities', lines: 4 },
      { type: 'notes', label: 'Questions I want answered', lines: 4 },
    ],
    sources: [SSA_SOURCE],
    footer: FOOTER,
  },
  legacy: {
    id: 'legacy',
    title: 'Legacy Cost Checklist',
    subtitle: 'Leave instructions, not a bill',
    filename: 'Latimore-Legacy-Cost-Checklist.pdf',
    emailSubject: 'Your Legacy Cost Checklist',
    blocks: [
      {
        type: 'paragraph',
        text: 'Use this checklist with the Legacy Cost Snapshot on our website. It helps you write down the immediate costs you would want handled without forcing family members to improvise, and the information they would need to find. It is an educational estimate, not a quote.',
      },
      { type: 'heading', text: 'Step 1. Immediate costs' },
      {
        type: 'fields',
        items: ['Final arrangements (funeral or cremation, services)', 'Cemetery, marker, or memorial costs', 'Outstanding debts', 'Medical bills', 'Legal or estate expenses', 'Other immediate obligations'],
      },
      { type: 'total', label: 'Total immediate costs' },
      { type: 'paragraph', text: 'National median funeral figures usually leave out cemetery, monument, and cash-advance charges, so list those separately if they apply. Local prices vary by provider, so ask for written price lists.' },
      { type: 'heading', text: 'Step 2. Funds already set aside' },
      { type: 'fields', items: ['Savings earmarked for these costs', 'Coverage already in place for these costs'] },
      { type: 'total', label: 'Estimated immediate legacy funding gap' },
      { type: 'heading', text: 'Step 3. Information your family should be able to find' },
      {
        type: 'checklist',
        items: [
          'Beneficiary names on every policy and account',
          'Policy and account list, with the company and a contact number for each',
          'Will, power of attorney, and health care directive, and where they are kept',
          'Your wishes for services, burial or cremation, and any pre-arrangements',
          'Names and numbers for your attorney, tax preparer, and employer benefits contact',
          'Where your important papers and digital account information are stored',
        ],
      },
      { type: 'heading', text: 'Step 4. People to contact' },
      { type: 'fields', items: ['First contact (name and phone)', 'Second contact (name and phone)', 'Attorney (name and phone)', 'Funeral home, if chosen (name and phone)'] },
      { type: 'notes', label: 'Notes for my family', lines: 4 },
      { type: 'notes', label: 'Questions I want answered', lines: 3 },
    ],
    sources: [NFDA_SOURCE],
    footer: FOOTER,
  },
}

export function isWorksheetId(value: unknown): value is WorksheetId {
  return typeof value === 'string' && (WORKSHEET_IDS as readonly string[]).includes(value)
}

export function getWorksheet(id: WorksheetId): WorksheetDocument {
  return WORKSHEETS[id]
}

export function worksheetToPlainText(doc: WorksheetDocument): string {
  const parts: string[] = [doc.title, doc.subtitle]
  for (const b of doc.blocks) {
    if (b.type === 'heading' || b.type === 'paragraph') parts.push(b.text)
    else if (b.type === 'fields' || b.type === 'checklist' || b.type === 'bullets') parts.push(...b.items)
    else if (b.type === 'total') parts.push(b.label)
    else if (b.type === 'notes') parts.push(b.label)
  }
  return parts.join('\n')
}
