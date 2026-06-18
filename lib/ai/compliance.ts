// PA DOI insurance-marketing compliance checks for AI-generated content.
// Fast, deterministic regex rules — no LLM call required.

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

const CRITICAL_PATTERNS: Array<{ pattern: RegExp; rule: string; description: string }> = [
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
]

const MAJOR_PATTERNS: Array<{ pattern: RegExp; rule: string; description: string }> = [
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
    pattern: /fear|terrif|scar|panic|danger|risk of death|die without/i,
    rule: 'FEAR_BASED_MARKETING',
    description: 'Fear-based marketing violates dignity-first brand guidelines',
  },
  {
    pattern: /limited time|act now|expires|last chance|only \d+ (spots|slots|openings) left/i,
    rule: 'FALSE_URGENCY',
    description: 'False urgency claims may violate PA DOI regulations',
  },
]

const MINOR_PATTERNS: Array<{ pattern: RegExp; rule: string; description: string }> = [
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
