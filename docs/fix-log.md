# Latimore OS Fix Log

## Current Required Fixes

- Add explicit `turbopack.root` in `next.config.js`.
- Validate required Supabase, Resend, Google Chat, GA, and GTM environment variables.
- Replace Twilio notification path with Google Chat webhook.
- Ensure service cards route to `/education` or `/legacy-checkup`.
- Preserve GBP and PAHS source tracking through lead capture.
- Harden `/api/fillout` and `/api/pahs-lead` with validation and explicit JSON responses.
- Confirm Vercel production env vars match `.env.local`.

## 2026-06-16 Audit Loop Patch

- Pinned Turbopack to the repository directory so Next.js does not select a parent workspace lockfile.
- Added a shared required environment-variable helper for lead intake routes.
- Routed service-page CTAs into `/education` with Google Business Profile UTM and source attribution.
- Hardened Fillout, consultation, and PAHS lead responses so failed capture returns explicit JSON errors.
- Added Google Chat webhook notification support for lead intake alerts.
