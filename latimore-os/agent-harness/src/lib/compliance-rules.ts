/**
 * Compliance rules seam.
 *
 * agent-harness has its own package.json/tsconfig and is built independently
 * of the main Next.js app, but the PA DOI regex rules below must not drift
 * between the two systems (main app: lib/ai/compliance.ts). Rather than
 * vendoring a second copy, this file re-exports the canonical patterns via a
 * relative import across the repo boundary.
 *
 * This is the one place that import crosses package boundaries. If a future
 * deploy target can't resolve it (e.g. agent-harness gets packaged/deployed
 * on its own, without the rest of this repo checked out), replace the
 * re-export below with a vendored copy of the three pattern arrays — every
 * other file in agent-harness only ever imports from this module, so the
 * fallback is a one-file change. `npm run agent-harness:typecheck` (wired
 * into `npm run validate`) fails loudly if this import ever breaks.
 */
export { CRITICAL_PATTERNS, MAJOR_PATTERNS, MINOR_PATTERNS } from '../../../../lib/ai/compliance'
export type { CompliancePattern } from '../../../../lib/ai/compliance'
