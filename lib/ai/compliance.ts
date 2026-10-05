// PA DOI insurance-marketing compliance checks for AI-generated content.
// Fast, deterministic regex rules — no LLM call required.
//
// This file is the single source of truth for the rule patterns below.
// latimore-os/agent-harness/src/workers/compliance-reviewer.ts imports
// CRITICAL_PATTERNS/MAJOR_PATTERNS/MINOR_PATTERNS from here (via a relative
// path, see latimore-os/agent-harness/src/lib/compliance-rules.ts) instead of
// keeping its own copy, so the two systems can't silently drift apart. Keep
// this file free of imports/Node APIs so it stays importable from that
// separate package's TypeScript build.

export type ComplianceSeverity = 'critical' | 'major' | 'minor'

export type ComplianceViolation = {
  rule: string
  severity: ComplianceSeverity
  description: string
  excerpt: string
}

export type ComplianceResult = {
  passed: boolean
  violations: ComplianceViolation[]
  warnings: string[]
}

export type CompliancePattern = { pattern: RegExp; rule: string; description: string }

export const CRITICAL_PATTERNS: CompliancePattern[] = [
  {
    pattern: /guarantee[sd]?\s+(you|your|that|a|the)\s+(will|won't|shall|must)/i,
    rule: 'NO_GUARANTEE',
    description: 'Definitive guarantee language is prohibited in insurance marketing',
  },
  {
    pattern: /\$[\d,]+\s*(per month|\/month|monthly)\s*(guaranteed|for sure|definitely)/i,
    rule: 'NO_SPECIFIC_PREMIUM_GUARANTEE',
    description: 'Specific premium amounts cannot be guaranteed without an official illustration',
  },
  {
    pattern: /you (will|won't|shall) (receive|get|earn|make|pay)/i,
    rule: 'NO_DEFINITIVE_OUTCOME',
    description: 'Definitive outcome statements are prohibited — use "may", "can", or "could"',
  },
  {
    pattern: /medical (advice|diagnosis|treatment|prescription)/i,
    rule: 'NO_MEDICAL_ADVICE',
    description: 'Medical advice is strictly prohibited',
  },
  {
    pattern: /legal (advice|counsel|opinion|guidance)/i,
    rule: 'NO_LEGAL_ADVICE',
    description: 'Legal advice is strictly prohibited',
  },
  {
    pattern: /\btax[-\s]?free\b/i,
    rule: 'NO_TAX_FREE_CLAIM',
    description: 'Tax-free claims are prohibited — describe tax treatment only as "may", subject to current law, and refer to a tax professional',
  },
  {
    pattern: /guaranteed\s+(lifetime\s+)?income/i,
    rule: 'NO_GUARANTEED_INCOME',
    description: 'Guaranteed income claims are prohibited without carrier contract language',
  },
  {
    pattern: /principal\s+(is\s+)?never\s+at\s+risk/i,
    rule: 'NO_PRINCIPAL_NEVER_AT_RISK',
    description: 'Absolute principal-protection claims are prohibited',
  },
  {
    pattern: /zero\s+(market\s+)?risk/i,
    rule: 'NO_ZERO_RISK',
    description: 'Zero-risk claims are prohibited',
  },
  {
    pattern: /never\s+lose\s+(another\s+)?(a\s+)?dollar/i,
    rule: 'NO_NEVER_LOSE_DOLLAR',
    description: 'Absolute no-loss claims are prohibited',
  },
  {
    pattern: /income\s+you\s+(can['\u2019]?t|cannot|can\s+not)\s+outlive/i,
    rule: 'NO_CANNOT_OUTLIVE_INCOME',
    description: '"Income you cannot outlive" is an absolute claim; use "may help provide income" with carrier terms',
  },
  {
    pattern: /get[-\s]rich[-\s]quick/i,
    rule: 'NO_GET_RICH_QUICK',
    description: 'Get-rich-quick language is prohibited',
  },
  {
    pattern: /easy\s+money/i,
    rule: 'NO_EASY_MONEY',
    description: 'Easy-money language is prohibited',
  },
  {
    pattern: /unlimited\s+(income|earning)/i,
    rule: 'NO_UNLIMITED_INCOME',
    description: 'Unlimited income or earnings claims are prohibited',
  },
  {
    pattern: /no\s+experience\s+(needed|necessary|required)/i,
    rule: 'NO_EXPERIENCE_NEEDED',
    description: 'Recruiting claims implying no experience or licensing is needed are prohibited',
  },
  {
    pattern: /guarantee[sd]?\s+(approval|acceptance|returns?)|guaranteed\s+(approval|acceptance|returns?)/i,
    rule: 'NO_GUARANTEED_APPROVAL_OR_RETURNS',
    description: 'Guaranteed approval, acceptance, or returns claims are prohibited (underwriting and performance are not assured)',
  },
  {
    pattern: /\$\s?\d[\d,.]*\s*(?:[kmb]|million|billion|thousand)?\+?\s*(?:in\s+)?(?:\w+\s+)?(growth|returns?|gains?)\b/i,
    rule: 'NO_DOLLAR_GROWTH_PROJECTION',
    description: 'Dollar growth/return projections are prohibited; do not project income or returns',
  },
]

export const MAJOR_PATTERNS: CompliancePattern[] = [
  {
    pattern: /best (insurance|policy|plan|product|rate|deal) (in|on|for)/i,
    rule: 'SUPERLATIVE_CLAIM',
    description: 'Superlative claims ("best") require substantiation',
  },
  {
    pattern: /\d+%\s*(return|growth|gain|yield|interest)\s*(guaranteed|assured|certain)/i,
    rule: 'GUARANTEED_RETURN',
    description: 'Guaranteed return percentages require an official illustration',
  },
  {
    pattern: /(scare tactics|panic now|terrified|die without coverage|risk of death without)/i,
    rule: 'FEAR_BASED_MARKETING',
    description: 'Fear-based marketing violates dignity-first brand guidelines',
  },
  {
    pattern: /limited time|act now|expires|last chance|only \d+ (spots|slots|openings) left/i,
    rule: 'FALSE_URGENCY',
    description: 'False urgency claims may violate PA DOI regulations',
  },
  {
    pattern: /(safe|secure)\s+retirement\s+paycheck/i,
    rule: 'SAFE_RETIREMENT_PAYCHECK',
    description: '"Safe/secure retirement paycheck" implies assured income',
  },
  {
    pattern: /risk[-\s]free/i,
    rule: 'RISK_FREE_CLAIM',
    description: 'Risk-free claims are misleading',
  },
  {
    pattern: /beat(s|ing)?\s+the\s+market/i,
    rule: 'BEAT_THE_MARKET',
    description: 'Market-outperformance claims are prohibited',
  },
  {
    pattern: /gains?\s+without\s+(the\s+)?(losses|loss|risk)/i,
    rule: 'GAINS_WITHOUT_LOSSES',
    description: 'Gains-without-losses claims are misleading',
  },
  {
    pattern: /(many|most|other|some)\s+(financial\s+)?(advisors?|agents?|brokers?)\s+(don['\u2019]?t|do\s+not|won['\u2019]?t|never|fail\s+to|hide)/i,
    rule: 'DISPARAGES_OTHER_ADVISORS',
    description: 'Disparaging other advisors, agents, or brokers is prohibited',
  },
  {
    pattern: /family\s+history\s+of\s+(?:\w+\s+){0,3}?(cancer|heart\s+disease|diabetes|stroke|alzheimer['\u2019]?s|dementia)/i,
    rule: 'FEAR_HEALTH_TARGETING',
    description: 'Referencing family health history/disease to pressure prospects is fear-based health targeting',
  },
]

export const MINOR_PATTERNS: CompliancePattern[] = [
  {
    pattern: /always|never|every (family|person|client|customer)/i,
    rule: 'ABSOLUTE_LANGUAGE',
    description: 'Absolute language should be softened with qualifiers',
  },
  {
    pattern: /\$[\d,]{4,}/,
    rule: 'SPECIFIC_DOLLAR_AMOUNT',
    description: 'Specific dollar amounts should reference official illustrations',
  },
]

export function checkCompliance(content: string): ComplianceResult {
  if (!content) return { passed: true, violations: [], warnings: [] }

  const violations: ComplianceViolation[] = []
  const warnings: string[] = []

  for (const { pattern, rule, description } of CRITICAL_PATTERNS) {
    const match = content.match(pattern)
    if (match) violations.push({ rule, severity: 'critical', description, excerpt: match[0].slice(0, 100) })
  }

  for (const { pattern, rule, description } of MAJOR_PATTERNS) {
    const match = content.match(pattern)
    if (match) violations.push({ rule, severity: 'major', description, excerpt: match[0].slice(0, 100) })
  }

  for (const { pattern, rule, description } of MINOR_PATTERNS) {
    const match = content.match(pattern)
    if (match) warnings.push(`[${rule}] ${description} — found: "${match[0].slice(0, 50)}"`)
  }

  return { passed: violations.length === 0, violations, warnings }
}
