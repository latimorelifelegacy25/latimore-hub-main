// Self-test: node scripts/check-brand-content.selftest.mjs
import { loadRules, NEW_RULES } from './brand-rules.mjs'

const rules = loadRules()
const byName = Object.fromEntries(rules.map((r) => [r.rule, r.regex]))
const positives = {
  NO_TAX_FREE_CLAIM: ['Enjoy tax-free retirement', 'tax free income'],
  NO_GUARANTEED_INCOME: ['Get guaranteed lifetime income', 'guaranteed income for life'],
  NO_PRINCIPAL_NEVER_AT_RISK: ['Your principal is never at risk', 'principal never at risk'],
  NO_ZERO_RISK: ['zero risk growth', 'zero market risk'],
  NO_NEVER_LOSE_DOLLAR: ['never lose another dollar', 'never lose a dollar'],
  NO_CANNOT_OUTLIVE_INCOME: ["income you can't outlive", 'income you cannot outlive', 'income you can\u2019t outlive'],
  NO_GET_RICH_QUICK: ['a get rich quick plan', 'get-rich-quick'],
  NO_EASY_MONEY: ['This is easy money'],
  NO_UNLIMITED_INCOME: ['unlimited income potential', 'unlimited earning'],
  NO_EXPERIENCE_NEEDED: ['No experience needed', 'no experience required'],
  NO_GUARANTEED_APPROVAL_OR_RETURNS: ['guaranteed approval', 'guaranteed acceptance', 'guaranteed returns', 'we guarantee approval'],
  NO_DOLLAR_GROWTH_PROJECTION: ['$1.3M+ growth', '$250,000 in returns', '$50K gains'],
  SAFE_RETIREMENT_PAYCHECK: ['a safe retirement paycheck', 'secure retirement paycheck'],
  RISK_FREE_CLAIM: ['risk-free growth', 'risk free'],
  BEAT_THE_MARKET: ['beat the market', 'beats the market'],
  GAINS_WITHOUT_LOSSES: ['gains without losses', 'gains without the risk'],
  DISPARAGES_OTHER_ADVISORS: ["many advisors don't tell you", 'most agents never explain'],
  FEAR_HEALTH_TARGETING: ['family history of heart disease means act now', 'family history of cancer'],
}
const neutral = [
  'This strategy may help supplement retirement income.',
  'Benefits are subject to carrier terms and underwriting.',
  'Results depend on policy design and are not guaranteed.',
  'Tax treatment may vary; consult a tax professional.',
  'Guaranteed issue products depend on carrier terms.',
  'We offer a free consultation and a risk assessment.',
  'Coverage can help families plan, depending on policy design.',
]
let failed = 0
for (const name of NEW_RULES) if (!byName[name]) { console.error(`MISSING rule in compliance.ts: ${name}`); failed++ }
for (const [name, samples] of Object.entries(positives)) {
  if (!NEW_RULES.has(name)) { console.error(`fixture for unknown rule ${name}`); failed++ }
  for (const sample of samples) if (!byName[name]?.test(sample)) { console.error(`NOT CAUGHT [${name}]: ${sample}`); failed++ }
}
for (const name of NEW_RULES) if (!positives[name]) { console.error(`no fixture for ${name}`); failed++ }
for (const text of neutral) for (const { rule, regex } of rules) if (regex.test(text)) { console.error(`FALSE POSITIVE [${rule}]: ${text}`); failed++ }
if (failed) { console.error(`${failed} self-test failure(s)`); process.exit(1) }
console.log(`Self-test passed: ${NEW_RULES.size} rules, ${neutral.length} neutral samples.`)
