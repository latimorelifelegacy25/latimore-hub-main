# SEO and tracking implementation — 2026-10-12

Canonical domain: https://www.latimorelifelegacy.com. Source: latimorelifelegacy25/latimore-hub-main.

## Implemented

- Removed the global homepage canonical inherited by pages without their own canonical. Added page-specific canonical tags for Schuylkill, PAHS, consultation, services funnel, and the three planning tools. The client-rendered Legacy Checkup now has a metadata layout.
- Added a server-rendered branded PNG Open Graph image at /opengraph-image and updated site-wide OG/Twitter references from the missing /og-image.jpg.
- Added the published Pottsville address to InsuranceAgency JSON-LD; no unverified hours, reviews, ratings, or coordinates.
- Added optional NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION metadata support.
- Updated robots.txt to discourage crawling private routes. The thank-you page is intentionally not blocked, so its noindex metadata can be seen by search engines.
- Updated sitemap.xml: includes PAHS, services funnel, and the live education checkup; excludes redirect-only legacy-checkup and book-now; static pages no longer claim a new lastModified date on every build. Blog dates remain intact.
- Added GA4 events for high-intent clicks, planning-tool actions, and generate_lead after successful lead submissions, including the three Solution Snapshot forms. First-party CRM/event tracking remains intact. External analytics receive no client names, contact details, answers, or financial estimates.
- Kept the legacy conversion event for existing integrations. Mark only generate_lead as a GA4 key event to avoid double-counting.

## Owner-access configuration and verification

1. **Search Console:** Verify the domain/property (DNS preferred). For meta verification, set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel production, redeploy, and submit https://www.latimorelifelegacy.com/sitemap.xml. Review indexed URLs, queries, clicks, impressions, CTR, and average position.
2. **GA4:** NEXT_PUBLIC_GA4_ID is configured in Vercel. Verify DebugView and tag configuration. Test call_click, book_consultation_clicked, tool_start, tool_complete, and generate_lead. Confirm only successful leads count as key events; exclude internal traffic and verify cross-domain/referral handling.
3. **Vercel Web Analytics:** @vercel/analytics is present in code, but the Vercel API reported web_analytics_not_enabled. Enable the project-level Web Analytics service before expecting Vercel pageview reports.
4. **Privacy:** Review cookie consent and privacy notices before expanding advertising pixels or third-party tags. Do not send health, financial, or contact details to analytics vendors.
5. **Google Business Profile:** Confirm ownership and published business name/address/phone/service areas. No profile changes were made by this code patch.

## QA checklist

- Check /robots.txt, /sitemap.xml, /opengraph-image (PNG 1200×630), /thank-you noindex, and unique canonical links on /, /schuylkill, /pahs, /solutions, /solutions/*, /education/checkup.
- Run npm run lint, npm run typecheck, and npm run build. Inspect Vercel preview before production.
- Verify a test lead in CRM and GA4 DebugView; compare first-party lead counts to GA4 generate_lead counts and investigate differences.

## KPI framework (baseline requires verified analytics data)

Weekly: Search Console clicks/impressions/CTR/average position/indexed URLs; GA4 engaged sessions and high-intent CTA clicks; successful generate_lead events; lead-to-consultation and consultation-to-qualified-lead rates; tool_start → tool_complete → generate_lead funnel by tool; Vercel Core Web Vitals once enabled. Segment by landing page, channel, campaign, and county where consent and data quality permit. Compare rolling 28-day windows and annotate deployments.

## Campaign UTMs

Use consistent lowercase utm_source, utm_medium, utm_campaign, utm_content values. Do not put names, emails, phone numbers, or financial inputs into URLs. Recommended mediums: organic_social, email, referral, qr, paid.

## Measurement and metadata cleanup — 2026-10-14

- Corrected redundant brand text in child-page titles for Contact, Find My Fit, Join, Book, Products, and Business Continuity. The root metadata template appends the business brand once.
- Set Contact Open Graph title/description and standardized its preview image to the site's generated 1200×630 /opengraph-image asset.
- Added the publicly indexable /join recruiting page to sitemap.xml, with its existing /join self-canonical retained.
- Removed self-referral UTM parameters from the internal Family Protection and consultation links. Existing click/tool-event callbacks remain in place, preserving first-party attribution context without overwriting the visitor's external marketing source.
- No change was made to the currently working /products/find-my-fit canonical or description, existing insurance disclosures, protected paths, or the main GA4 tag ownership.

### Release QA

1. Verify Vercel preview builds without TypeScript, lint, or routing errors; inspect /contact, /products/find-my-fit, /products, /book, /join, /services/business-continuity, and /solutions.
2. Verify each page renders one brand suffix in its HTML title, a clean self-canonical, and a unique description. Contact should emit the sitewide 1200×630 social image.
3. Check that /sitemap.xml contains /join and no query parameter URLs, and /robots.txt still advertises the same sitemap.
4. Test the internal booking and snapshot links: URL must be clean, while the tracking click event must still fire. For an externally tagged landing visitor, first-party campaign attribution should persist across internal navigation.
5. Verify live Search Console sitemap processing and GA4 DebugView/key-event configuration with the authenticated Google account before claiming those account-level tasks are complete.
