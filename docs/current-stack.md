# Current Production Stack

This document is the authoritative stack reference for Latimore Hub OS. It supersedes legacy contractor notes that referenced Twilio, SendGrid, or Railway.

## Application

- Next.js App Router
- TypeScript
- Prisma ORM

## Hosting and Delivery

- Vercel for application hosting, scheduled jobs, and production deployments
- GitHub Actions for lint, typecheck, build, and test validation before merge

## Data

- Supabase PostgreSQL as the system of record
- Supabase service-role access only from server-side code and scheduled workers

## Notifications and Messaging

- Resend for email delivery
- Google Chat for internal lead, task, appointment, and operational notifications

## Scheduling and Calendar

- Google Calendar for appointment coordination and calendar visibility
- Vercel Cron for scheduled workers

## Analytics and Attribution

- GA4 for web analytics
- First-party lead/session/inquiry records for source, medium, campaign, UTM term, UTM content, referrer, and landing-page attribution

## Retired Legacy References

Twilio, SendGrid, and Railway are not part of the current production architecture. Do not add new production dependencies, runbooks, or diagrams that rely on them without an explicit architecture decision replacing this document.
