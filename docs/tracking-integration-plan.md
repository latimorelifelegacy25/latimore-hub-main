# Latimore Tracking Integration

This file records the production tracking standard for Latimore Life & Legacy LLC.

## Principle

Every public page, assessment, CTA, form, QR journey, advisor workflow, and training tool must emit first-party tracking into the existing Latimore event pipeline. Carrier names, carrier logos, and proprietary product names are not used in the public-facing analytics taxonomy.

## Canonical dimensions

- page URL
- lead session ID
- source
- medium
- campaign
- UTM content / term when available
- county when known
- Latimore solution category
- tool/module name
- semantic action
- placement
- timestamp

## Public solution taxonomy

- Life Protection
- Living Benefits
- Mortgage Protection
- Retirement Income
- Final Expense
- Business Protection
- Legacy Planning
- Education
- General

## Reporting layers

1. **Supabase operational events** — first-party source of truth and live activity.
2. **Latimore Analytics Command Center** — visible operational tracking, conversion funnel, sources, pages, and activity.
3. **GA4** — acquisition and website behavior mirror for non-PII events.
4. **Meta** — approved marketing/conversion events only.
5. **Vercel** — technical health, deployment, and runtime observability; not the business analytics source of truth.

## Tool event standard

New Latimore tools should use semantic metadata on the existing event pipeline until dedicated database enum values are promoted through a schema migration. Required metadata fields:

- `latimoreEvent`
- `tool`
- `category`
- optional `step`
- optional `resultBand`
- optional `placement`

Recommended semantic actions:

- `tool_opened`
- `tool_started`
- `tool_step_completed`
- `tool_completed`
- `tool_result_viewed`
- `tool_cta_clicked`
- `quiz_answered`

No personally identifiable financial or health answers should be sent to GA4 or Meta. Sensitive assessment values remain in first-party application storage only.
