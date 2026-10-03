# Latimore Hub codebase audit

Audit date: October 2, 2026, Eastern time (October 3 UTC).
Repository: latimorelifelegacy25/latimore-hub-main. Baseline: 1cb6ed5daa4499706f53220a04c5862be59b09c8.
Vercel project: latimore-hub-main; production domains include www.latimorelifelegacy.com and hub.latimorelifelegacy.com.

## Scope and method

Repository inventory: 979 tracked files; 640 application/component/library/email/content/campaign-seed source files checked for branding regressions; 179 API route files; 48 Prisma models. Inspected auth middleware, role/session helpers, cron authentication, token storage, HTML rendering, rate limiting, build configuration, CI, public licensing/contact information, calculator formulas, and schema/migration coverage. Ran root and nested dependency audits, lint, TypeScript checks, production build, targeted encryption tests, and public production smoke tests. API inventory scanning identifies candidates for review; absence of a guard string alone does not prove a vulnerability, because middleware and re-exported handlers also provide authorization.

This is a source and automated validation audit, not a claim that every authenticated integration has been exercised. No customer messages, social posts, production data changes, or database migrations were executed. Production secrets were not downloaded. Database-backed flows, external OAuth flows, provider publishing, booking delivery, and live RLS state remain unverified.

## Corrections included

| Finding | Change | Evidence |
| --- | --- | --- |
| Calculator falsely stated “Licensed in All 50 States” | Replaced with “Licensed in Pennsylvania · PA DOI #1268820”; retained NIPR #21638507 | Calculator source; brand regression check |
| Emoji decoration across public and admin pages, templates, notifications and campaign seeds | Removed emoji sequences while retaining ordinary copyright/navigation symbols and existing SVG icons | 640-file content regression scan |
| PAHS seed campaign contained obsolete 717-615-2613 contact number | Corrected to 570-900-1977 | Content regression scan |
| Calculator generated a fabricated Ethos discount and savings | Removed the carrier-specific offer and its formulas | Source review |
| Calculator presented assumed annuity rates as carrier rates/guaranteed payments | Removed carrier-specific attribution, labeled assumptions as hypothetical, replaced misleading total-return percentage with a payout-illustration label | Source review; actual carrier illustration still required |
| Calculator allowed zero/negative premium values and overflowed narrow mobile layouts | Enforced a positive premium and responsive grid minimum | Source review/type check |
| Missing encryption key silently stored plaintext OAuth tokens in production | New production writes fail closed; development fallback and legacy-row reads remain compatible | Two regression tests: round-trip/tampering and missing-key behavior |
| Weekly-report and engagement-spike routes used ad hoc cron-secret equality | Reused the configured-secret, timing-safe authentication helper | Source review |
| GA4 connection-status route lacked its own session guard | Added shared role-aware admin authorization | Source/type check |
| Health endpoint returned raw database exception details publicly | Returns a generic database-unavailable message | Source review |
| Composer inserted unsanitized HTML into preview/editor and accepted arbitrary link schemes | Sanitize HTML using existing DOMPurify dependency; allow HTTP(S) inserted links | Source/type check; browser interaction still unverified |
| AI guardrails did not explicitly forbid emoji or nationwide licensing claims | Added Pennsylvania licensing and no-emoji instructions | Source review |
| No regression gate for these branding issues | Added scripts/check-brand-content.mjs and CI steps for content validation and encryption tests | Local checks |

## Validation

| Check | Result |
| --- | --- |
| npm ci | Passed |
| Brand content check | Passed across 640 source files |
| npm run lint | Passed: 0 errors, 74 warnings |
| npm run typecheck | Passed |
| Agent harness dependency installation/type check | Passed |
| Edge worker dependency installation/type check | Passed |
| Production build | Passed on Vercel and GitHub CI for commit 5dfac1c83e755796dd3a8b31bc199a722ccbe9b3; local export-directory cleanup remains intermittent. |
| Token encryption regression tests | 2 passed |
| Existing public production smoke tests | 9 passed: /, /about, /products, /services, /contact, /join, /pahs, /admin (307 login redirect), /api/health |
| npm run preflight | Blocked locally: 5 required and 16 recommended environment variables absent; this does not establish production configuration status |
| npm run security:rls:check | Failed: three table declarations missing from tracked migrations |

Local builds intermittently hit ENOTEMPTY while cleaning the generated export directory (404.html and 500.html remained). One clean rebuild succeeded; later exact-patch builds compiled and generated pages but hit the same cleanup error. Lint and TypeScript gates were not weakened. Vercel production deployment dpl_F7agG2a8YJ8hZYvsp1K6QbxiTwZC reached READY, and GitHub CI run 37093070703 completed successfully for the exact released commit.

## Findings requiring follow-up

| Priority | Finding | Evidence and next action |
| --- | --- | --- |
| High | Root dependency audit reports 10 affected package entries: 8 high, 1 moderate, 1 low | Affected names: @next/eslint-plugin-next, braces, chokidar, eslint-config-next, fast-glob, micromatch, next, postcss, tailwindcss, esbuild. Several are transitive chains for the same underlying advisories, not ten independent exploits. npm proposes major changes including Next 16, Tailwind 4 and altered ESLint packages. Perform a compatible dependency upgrade and rerun all checks; do not use npm audit fix --force blindly. |
| High | Edge worker dependency audit reports 7 affected package entries: 5 high, 2 moderate | Affected names: @fastify/busboy, esbuild, miniflare, sharp, undici, wrangler, ws. npm proposes Wrangler 4.147.0, a major upgrade. Verify worker compatibility separately. Agent harness audit: 0 advisories. |
| High | RLS source coverage is missing for JoinApplication, JoinFormEvent, SocialAccountMetric | scripts/check-rls-coverage.mjs compares 48 model names against tracked migrations. Verify live database policies and prepare server-only policies before applying a migration. Source gaps alone do not establish public database exposure. |
| Medium | Production OAuth encryption configuration and existing plaintext rows are unverified | New writes now refuse plaintext in production without TOKEN_ENCRYPTION_KEY. Confirm key presence and plan legacy-row re-encryption without rotating/removing a key used by existing ciphertext. |
| Medium | In-memory rate-limit fallback is per-process | lib/rate-limit.ts falls back when Redis is unavailable. Distributed serverless instances do not share the local counters. Confirm Redis health and decide fail-closed behavior for costly/abuse-sensitive operations. |
| Medium | Public blog renderer trusts repository-authored Markdown HTML | app/blog/[slug]/page.tsx renders marked output. Current source is repository content; future untrusted CMS/AI ingestion must sanitize before rendering. Composer previews are patched separately. |
| Medium | Existing database seed rows may retain old phone numbers or emojis | Updating seed source does not update already seeded production records. Review persisted campaign/template rows before publishing; no reseeding was performed. |
| Medium | 74 lint warnings remain | Warnings include unused values/imports, hook dependencies, image usage and CommonJS imports. Triage by runtime impact rather than automatically suppressing rules. |
| Medium | Canonical brand palette differs from the user’s locked palette | lib/brand.ts/public tokens include navy #0E1A2B and gold #C9A25F; user standard is navy #2C3E50 and gold #C49A6C. Plan a coordinated token/design review rather than changing every dark surface blindly. |
| Low | Repository guidance has drifted from executable scripts | CLAUDE.md says no test suite and describes npm run check as a TypeScript check; package.json has smoke tests and a separate typecheck script. Update guidance after agreeing on the validation workflow. |

## Release and residual limits

Changes were committed to GitHub and deployed to Vercel. Live checks returned HTTP 200 for the calculator and confirmed Pennsylvania licensing, PA DOI #1268820, no 50-state claim, no shield/chart emojis and no fabricated Ethos offer. All nine post-deployment smoke checks passed. The application has not been certified vulnerability-free. Major dependency upgrades, live database policy remediation, persisted content cleanup, and authenticated integration testing remain separate work items with specific evidence above. The calculator is educational and hypothetical; it does not connect to carrier rating systems and must not be presented as an official quote.
