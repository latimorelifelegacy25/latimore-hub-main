# Production Deployment Drift — 2026-06-23

## Finding

Production is serving an older Vercel deployment for `latimore-hub-main` even though the booking and Ethos redirect repair from PR #233 is already merged into `main`.

## Evidence

- PR #233 is merged.
- Current `main` renders `/book` as an embedded Google Calendar Appointment Scheduling page.
- Current `main` sets `BRAND.bookingUrl` to `/book`.
- Vercel production deployment `dpl_3BH1xhrkrdh6o2owBSWJW52vxvxg` is READY but tied to commit `84e86b30e57ce0d89e91a75a554e99ec6739e399`.
- `main` is 284 commits ahead of that deployed commit.
- Public production still redirects `/book` to Fillout and still shows booking CTAs pointing to Fillout.

## Operational impact

The public booking and quote conversion layer is stale in production. CRM, Notion/reporting, cron, and admin-tab validation should remain secondary until production is redeployed from current `main` and the conversion path is smoke tested.

## Required verification after redeploy

1. `/book` returns 200 and renders the scheduler.
2. Homepage and services booking CTAs point to `/book`.
3. `/api/redirect/ethos?intent=quick_term` redirects to Ethos instead of returning a server error.
4. PAHS test lead creates Contact, Inquiry, Task, Event, and SystemEvent records.
5. Admin contacts, pipeline, tasks, and reports load the created record.

## Status

This document records the deployment drift and intentionally creates a main-branch commit to prompt the Git/Vercel deployment pipeline to run again.
