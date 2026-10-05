// Loads the new advertising-compliance rules straight from lib/ai/compliance.ts
// (single source of truth) so the CI script and self-test cannot drift from it.
import { readFileSync } from 'node:fs'

export const NEW_RULES = new Set([
  'NO_TAX_FREE_CLAIM', 'NO_GUARANTEED_INCOME', 'NO_PRINCIPAL_NEVER_AT_RISK', 'NO_ZERO_RISK',
  'NO_NEVER_LOSE_DOLLAR', 'NO_CANNOT_OUTLIVE_INCOME', 'NO_GET_RICH_QUICK', 'NO_EASY_MONEY',
  'NO_UNLIMITED_INCOME', 'NO_EXPERIENCE_NEEDED', 'NO_GUARANTEED_APPROVAL_OR_RETURNS',
  'NO_DOLLAR_GROWTH_PROJECTION', 'SAFE_RETIREMENT_PAYCHECK', 'RISK_FREE_CLAIM', 'BEAT_THE_MARKET',
  'GAINS_WITHOUT_LOSSES', 'DISPARAGES_OTHER_ADVISORS', 'FEAR_HEALTH_TARGETING',
])

export function loadRules(file = 'lib/ai/compliance.ts') {
  const src = readFileSync(file, 'utf8')
  const re = /pattern:\s*\/((?:\\.|[^/\n\\])+)\/([a-z]*),\s*rule:\s*'([A-Z_]+)'/g
  const rules = []
  for (const m of src.matchAll(re)) {
    if (!NEW_RULES.has(m[3])) continue
    // Strip the g flag concerns: use a fresh non-global regex per test.
    rules.push({ rule: m[3], regex: new RegExp(m[1], m[2]) })
  }
  return rules
}
