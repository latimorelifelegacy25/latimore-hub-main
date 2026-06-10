# Latimore OS Execution Contract

This document turns Latimore Hub into the operating command center for Latimore Life & Legacy LLC.

## Operating priority

1. Protect production admin access.
2. Capture every lead with source attribution.
3. Route every public CTA to one conversion path.
4. Track every booking, lead form, phone click, email click, and quote click.
5. Review CRM follow-up daily.

## Production safety rules

- `DISABLE_ADMIN_AUTH` must be `false` in production.
- `/admin` must remain protected by NextAuth middleware.
- No production secret belongs in committed code.
- Vercel environment variables must be set in the Vercel dashboard only.
- The production smoke test must pass before paid traffic or public campaign pushes.

## Main funnel

Primary CTA:

> Book Your Free Protection & Legacy Review

All campaign assets should point to this path unless the campaign is explicitly for recruiting or instant quote activity.

## Lead source taxonomy

Use these source values consistently:

- `facebook`
- `instagram`
- `linkedin`
- `google_business_profile`
- `qr_card`
- `website`
- `referral`
- `ethos`
- `chamber`
- `community_event`
- `direct`
- `unknown`

Use these campaign values for the next execution cycle:

- `family_protection`
- `business_owner_key_person`
- `mortgage_protection`
- `retirement_income`
- `recruiting`

## Required CRM fields

Every contact/inquiry should have:

- Name
- Phone
- Email
- County
- Lead source
- Campaign
- Product interest
- Pipeline stage
- Last contact date
- Next follow-up date
- Notes

No next follow-up date means the lead is not operationally controlled.

## Event tracking contract

Track these user actions through `/api/event` where applicable:

- `page_view`
- `cta_click`
- `call_click`
- `text_click`
- `email_click`
- `book_click`
- `form_submit`
- `lead_created`
- `appointment_booked`
- `stage_changed`
- `product_selected`
- `county_selected`

Recommended metadata keys:

- `cta_label`
- `cta_location`
- `destination_url`
- `campaign_asset`
- `audience`
- `funnel`

## Daily sales power hour

Daily execution block:

1. 15 minutes — new leads
2. 15 minutes — no-response leads
3. 15 minutes — booked consultation reminders
4. 15 minutes — dormant lead reactivation

## Weekly BI scorecard

Track these weekly:

- New leads
- Booked consultations
- Completed consultations
- Applications started
- Closed cases
- Recruitment conversations
- Follow-up completion rate
- Top source by lead count
- Top source by booked consultations
- Leads missing next follow-up date

## Next production gates

- Confirm Vercel env vars from `.env.local.example`.
- Confirm `/api/health` returns healthy database status.
- Submit a test form and verify the lead appears in admin.
- Verify admin login works and is not bypassed.
- Verify source/campaign attribution on test lead.
- Verify a booking creates or updates the correct CRM record.
