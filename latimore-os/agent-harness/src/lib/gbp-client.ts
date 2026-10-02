/**
 * GBP API seam.
 *
 * agent-harness has its own package.json/tsconfig and is built independently
 * of the main Next.js app, but the Google Business Profile HTTP calls below
 * must not drift between the two systems (main app: lib/gbp/http.ts). Rather
 * than vendoring a second copy, this file re-exports the canonical
 * implementation via a relative import across the repo boundary.
 *
 * This is the one place that import crosses package boundaries. If a future
 * deploy target can't resolve it (e.g. agent-harness gets packaged/deployed
 * on its own, without the rest of this repo checked out), replace the
 * re-export below with a vendored copy — every other file in agent-harness
 * only ever imports from this module, so the fallback is a one-file change.
 * `npm run agent-harness:typecheck` (wired into `npm run validate`) fails
 * loudly if this import ever breaks.
 *
 * NOTE: this re-exports lib/gbp/http.ts (the import-free HTTP layer), NOT
 * lib/gbp/client.ts — the client pulls in the server-side Google token store
 * (@/lib/calendar/google -> Prisma), which the harness's standalone
 * TypeScript build cannot resolve. The worker receives its OAuth access
 * token via its input instead; see gbp-publish-worker.ts.
 */
export {
  createLocalPost,
  listLocalPosts,
  listGbpAccounts,
  listGbpLocations,
  GbpNotConnectedError,
  GbpNotApprovedError,
  GbpError,
} from '../../../../lib/gbp/http'
export type {
  CreateLocalPostInput,
  GbpLocalPost,
  GbpCallToAction,
  GbpAccount,
  GbpLocation,
} from '../../../../lib/gbp/http'
