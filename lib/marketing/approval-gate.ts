// Server-side publish approval gate (pure, no I/O).
//
// Content may only be published when (a) the deterministic compliance reviewer
// finds no CRITICAL violation (computed here, never a client-supplied flag) and
// (b) its status is publishable. Missing campaign/UTM and missing source/citation
// are WARNINGS only, since existing flows (PAHS QR campaign, etc.) may not
// supply them. Fails CLOSED if the compliance check itself throws.

import { checkCompliance as defaultCheckCompliance, type ComplianceResult } from '../ai/compliance'

/** Statuses a scheduled/automated publisher may publish. */
export const PUBLISHABLE_STATUSES = ['approved', 'scheduled'] as const

/**
 * Statuses an authenticated human reviewer/admin may publish by explicitly
 * clicking "Publish" (the click is the approval). Never includes
 * published/archived/flagged.
 */
export const MANUAL_PUBLISHABLE_STATUSES = ['draft', 'approved', 'scheduled', 'failed'] as const

export type PublishGateInput = {
  /** Final text that will go out (title/body/caption). HTML is stripped. */
  text: string
  /** Current record status. Omit when the path has no status (direct publish). */
  status?: string | null
  /** Override the allow-list (default: PUBLISHABLE_STATUSES). */
  allowedStatuses?: readonly string[]
  campaign?: string | null
  utmSource?: string | null
  /** Pass true/false only where the path has a notion of a source; omit otherwise. */
  hasSource?: boolean
  /** Injectable for tests. */
  checkCompliance?: (content: string) => ComplianceResult
  /** Override PUBLISH_GATE_MODE (tests). */
  mode?: PublishGateMode
}

export type PublishGateMode = 'enforce' | 'warn'

/** PUBLISH_GATE_MODE: 'warn' softens blockers to warnings; anything else enforces. */
export function getPublishGateMode(): PublishGateMode {
  return process.env.PUBLISH_GATE_MODE?.trim().toLowerCase() === 'warn' ? 'warn' : 'enforce'
}

export type PublishGateResult = {
  allowed: boolean
  blockers: string[]
  warnings: string[]
  /** True when warn mode let through content that enforce mode would have blocked. */
  wouldHaveBlocked: boolean
  /** Rule ids of CRITICAL violations (for generic notifications/logs). */
  blockedRules: string[]
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function evaluatePublishGate(input: PublishGateInput): PublishGateResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const blockedRules: string[] = []
  // Checker errors stay enforced in every mode (fail closed).
  const hardBlockers: string[] = []

  // Status
  if (input.status !== undefined) {
    const allowed = input.allowedStatuses ?? PUBLISHABLE_STATUSES
    const status = (input.status ?? '').toString().trim().toLowerCase()
    if (!allowed.includes(status)) {
      blockers.push('Content status is not publishable. It must be approved before publishing.')
    }
  }

  // Compliance (fail closed)
  try {
    const run = input.checkCompliance ?? defaultCheckCompliance
    const result = run(stripHtml(input.text ?? ''))
    for (const v of result.violations) {
      if (v.severity === 'critical') {
        blockers.push(`Compliance review failed (${v.rule}): ${v.description}`)
        blockedRules.push(v.rule)
      } else {
        warnings.push(`Compliance (${v.severity}) ${v.rule}: ${v.description}`)
      }
    }
    for (const w of result.warnings) warnings.push(`Compliance: ${w}`)
  } catch {
    const msg = 'Compliance review could not be completed. Publishing is blocked until it can run.'
    blockers.push(msg)
    hardBlockers.push(msg)
  }

  // Warnings only
  if (!input.campaign?.trim() && !input.utmSource?.trim()) {
    warnings.push('No campaign or UTM tag set.')
  }
  if (input.hasSource === false) {
    warnings.push('No source or citation attached.')
  }

  if ((input.mode ?? getPublishGateMode()) === 'warn') {
    const soft = blockers.filter((b) => !hardBlockers.includes(b))
    for (const b of soft) warnings.push(`[warn mode] would block: ${b}`)
    return {
      allowed: hardBlockers.length === 0,
      blockers: hardBlockers,
      warnings,
      wouldHaveBlocked: soft.length > 0,
      blockedRules,
    }
  }

  return { allowed: blockers.length === 0, blockers, warnings, wouldHaveBlocked: false, blockedRules }
}

/** Thrown by service-layer publishers when the gate blocks; routes map it to 422. */
export class PublishBlockedError extends Error {
  readonly blockers: string[]
  constructor(blockers: string[]) {
    super('Publish blocked by approval gate')
    this.name = 'PublishBlockedError'
    this.blockers = blockers
  }
}

export function publishBlockedBody(blockers: string[]) {
  return { ok: false, error: 'Publish blocked', blockers }
}
