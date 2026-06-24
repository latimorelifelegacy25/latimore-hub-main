export type ProductCategory = 'life' | 'annuity' | 'business'
export type ProductCtaType = 'quote' | 'consult' | 'find_fit'

export type ProductInterestValue =
  | 'Mortgage_Protection'
  | 'Final_Expense'
  | 'Term_Life'
  | 'Whole_Life'
  | 'Child_Whole_Life'
  | 'Accident'
  | 'Critical_Illness'
  | 'IUL'
  | 'Annuity'
  | 'Retirement'
  | 'Business'
  | 'General'

export type ProductCard = {
  slug: string
  name: string
  category: ProductCategory
  productInterest: ProductInterestValue
  tagline: string
  description: string
  bestFor: string[]
  ctaType: ProductCtaType
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  life: 'Life Insurance',
  annuity: 'Annuities',
  business: 'Business Solutions',
}

export const PRODUCT_INTEREST_LABELS: Record<ProductInterestValue, string> = {
  Mortgage_Protection: 'Mortgage Protection',
  Final_Expense: 'Final Expense',
  Term_Life: 'Term Life',
  Whole_Life: 'Whole Life',
  Child_Whole_Life: 'Child Whole Life',
  Accident: 'Accident Coverage',
  Critical_Illness: 'Critical Illness',
  IUL: 'Indexed Universal Life',
  Annuity: 'Annuity',
  Retirement: 'Retirement Planning',
  Business: 'Business Protection',
  General: 'General Protection Review',
}

export const PRODUCT_CATALOG: ProductCard[] = [
  {
    slug: 'term-life',
    name: 'Term Life Insurance',
    category: 'life',
    productInterest: 'Term_Life',
    tagline: 'Maximum protection. Minimum cost.',
    description:
      'Affordable coverage for 10-30 years — useful for income replacement, mortgage protection, and young families building a strong financial foundation.',
    bestFor: ['Young families', 'Mortgage holders', 'Income earners'],
    ctaType: 'quote',
  },
  {
    slug: 'whole-life',
    name: 'Whole Life Insurance',
    category: 'life',
    productInterest: 'Whole_Life',
    tagline: 'Coverage that never expires.',
    description:
      'Permanent protection with cash value features. Many designs use premiums set at issue, and applying younger and healthier can improve pricing.',
    bestFor: ['Final expense planning', 'Legacy building', 'Lifelong protection'],
    ctaType: 'consult',
  },
  {
    slug: 'iul',
    name: 'Indexed Universal Life (IUL)',
    category: 'life',
    productInterest: 'IUL',
    tagline: 'Growth potential with downside protection.',
    description:
      'Flexible premiums, death benefit, and cash value credited from market-index formulas with protection from direct index losses, subject to policy charges and product terms.',
    bestFor: ['High earners', 'Business owners', 'Flexible retirement planning'],
    ctaType: 'consult',
  },
  {
    slug: 'key-person',
    name: 'Key Person Insurance',
    category: 'business',
    productInterest: 'Business',
    tagline: 'Protect the people your business depends on.',
    description:
      'Business-owned protection designed to provide capital if a key owner or employee dies unexpectedly, helping the business recruit, recover, and continue operations.',
    bestFor: ['Small business owners', 'Partnerships', 'Employers'],
    ctaType: 'consult',
  },
  {
    slug: 'fixed-indexed-annuity',
    name: 'Fixed Indexed Annuity (FIA)',
    category: 'annuity',
    productInterest: 'Annuity',
    tagline: "Growth potential without direct market-loss exposure.",
    description:
      'Premium can earn interest linked to a market index while avoiding direct index losses, subject to caps, spreads, fees, riders, surrender charges, and product terms.',
    bestFor: ['Pre-retirees', 'Conservative savers', 'Retirement income planning'],
    ctaType: 'consult',
  },
  {
    slug: 'myga',
    name: 'Multi-Year Guaranteed Annuity (MYGA)',
    category: 'annuity',
    productInterest: 'Annuity',
    tagline: 'Fixed-rate growth for a set term.',
    description:
      'A tax-deferred annuity with a fixed interest rate for a multi-year period. Appropriate fit depends on liquidity needs, time horizon, and surrender-charge schedule.',
    bestFor: ['Retirees', 'Conservative savers', 'CD-alternative shoppers'],
    ctaType: 'consult',
  },
  {
    slug: 'executive-bonus-plan',
    name: 'Executive Bonus Plan',
    category: 'business',
    productInterest: 'Business',
    tagline: 'Reward and retain valuable team members.',
    description:
      'An employer-funded bonus strategy that can help select employees purchase life insurance while creating a retention-focused executive benefit.',
    bestFor: ['Business owners', 'Key executives', 'Selective employee incentives'],
    ctaType: 'consult',
  },
  {
    slug: 'endorsement-split-dollar',
    name: 'Endorsement Split Dollar',
    category: 'business',
    productInterest: 'Business',
    tagline: 'Executive protection with employer cost-recovery design.',
    description:
      'A business and employee may share policy benefits under a formal split-dollar arrangement. Structure requires tax and legal coordination.',
    bestFor: ['Executive benefit programs', 'Retention planning', 'Cost-recovery designs'],
    ctaType: 'consult',
  },
  {
    slug: 'buy-sell-insurance',
    name: 'Buy-Sell Insurance',
    category: 'business',
    productInterest: 'Business',
    tagline: 'Protect business continuity.',
    description:
      'Life insurance can fund a buy-sell agreement so surviving owners can purchase a deceased owner’s interest without forcing a rushed liquidation.',
    bestFor: ['Business partners', 'Multi-owner LLCs', 'Family businesses'],
    ctaType: 'consult',
  },
]

export function getProductBySlug(slug?: string | null) {
  if (!slug) return null
  return PRODUCT_CATALOG.find((product) => product.slug === slug) ?? null
}

export function getProductsByCategory(category: ProductCategory) {
  return PRODUCT_CATALOG.filter((product) => product.category === category)
}

export function getProductInterestLabel(value?: string | null) {
  if (!value) return PRODUCT_INTEREST_LABELS.General
  return PRODUCT_INTEREST_LABELS[value as ProductInterestValue] ?? value.replace(/_/g, ' ')
}
