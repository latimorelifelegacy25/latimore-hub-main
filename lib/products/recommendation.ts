import type { ProductInterestValue } from './catalog'

export type FitAnswers = {
  productInterest?: ProductInterestValue | string | null
  lifeStage?: 'young_family' | 'pre_retiree' | 'retiree' | 'business_owner' | 'high_income' | 'other' | null
  hasMortgage?: boolean | null
  hasDependents?: boolean | null
  ownsBusiness?: boolean | null
  hasEmployees?: boolean | null
  wantsRetirementIncome?: boolean | null
  wantsLegacyPlanning?: boolean | null
  timeline?: 'now' | '30_days' | '90_days' | 'researching' | null
}

export type ProductRecommendation = {
  primary: ProductInterestValue
  secondary: ProductInterestValue | null
  score: number
  reasons: string[]
}

const RECOMMENDATION_PRODUCTS: ProductInterestValue[] = [
  'Term_Life',
  'Whole_Life',
  'IUL',
  'Annuity',
  'Business',
  'General',
]

function addScore(
  scores: Record<ProductInterestValue, number>,
  reasons: string[],
  product: ProductInterestValue,
  points: number,
  reason: string,
) {
  scores[product] += points
  reasons.push(reason)
}

export function recommendProduct(answers: FitAnswers): ProductRecommendation {
  const scores = RECOMMENDATION_PRODUCTS.reduce(
    (acc, product) => ({ ...acc, [product]: 0 }),
    {} as Record<ProductInterestValue, number>,
  )
  const reasons: string[] = []

  if (answers.hasDependents) {
    addScore(scores, reasons, 'Term_Life', 25, 'You indicated family or dependents who may rely on your income.')
  }

  if (answers.hasMortgage) {
    addScore(scores, reasons, 'Term_Life', 20, 'You indicated a mortgage or housing obligation to protect.')
  }

  if (answers.lifeStage === 'young_family') {
    addScore(scores, reasons, 'Term_Life', 15, 'Young families often need larger protection amounts at efficient cost.')
  }

  if (answers.wantsLegacyPlanning) {
    addScore(scores, reasons, 'Whole_Life', 25, 'You selected legacy or permanent planning as a priority.')
  }

  if (answers.lifeStage === 'high_income') {
    addScore(scores, reasons, 'IUL', 20, 'You selected a high-income planning profile where flexible permanent insurance may be reviewed.')
  }

  if (answers.wantsRetirementIncome) {
    addScore(scores, reasons, 'Annuity', 30, 'You selected retirement income as a priority.')
  }

  if (answers.lifeStage === 'pre_retiree' || answers.lifeStage === 'retiree') {
    addScore(scores, reasons, 'Annuity', 20, 'Your life stage indicates retirement-income planning may be relevant.')
  }

  if (answers.ownsBusiness || answers.lifeStage === 'business_owner') {
    addScore(scores, reasons, 'Business', 30, 'You indicated business ownership or business-planning needs.')
  }

  if (answers.hasEmployees) {
    addScore(scores, reasons, 'Business', 20, 'You indicated employees or key people connected to the business.')
  }

  if (answers.timeline === 'now' || answers.timeline === '30_days') {
    for (const product of RECOMMENDATION_PRODUCTS) {
      if (product !== 'General' && scores[product] > 0) scores[product] += 5
    }
    reasons.push('Your timeline suggests this should be prioritized for follow-up.')
  }

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]) as Array<[ProductInterestValue, number]>

  const primary = ranked[0]?.[1] > 0 ? ranked[0][0] : 'General'
  const secondary = ranked[1]?.[1] > 0 ? ranked[1][0] : null
  const score = ranked[0]?.[1] ?? 0

  return {
    primary,
    secondary,
    score,
    reasons: reasons.length ? reasons : ['Your answers point to a general protection review as the best starting point.'],
  }
}
