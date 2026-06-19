# Latimore OS — Spec Hardening Document

## Purpose

This document hardens the Latimore OS / Latimore Life & Legacy digital system so future development does not drift from the intended business, brand, funnel, tracking, or deployment requirements.

The system must support one goal:

> Turn local visitors into qualified, educated, appointment-ready leads for Latimore Life & Legacy LLC.

---

## 1. Brand Non-Negotiables

### Business Identity

All public-facing pages, graphics, funnels, forms, and tracking assets must use:

- Latimore Life & Legacy LLC
- Protecting Today. Securing Tomorrow.
- #TheBeatGoesOn

The brand must not be replaced with generic insurance branding, random logos, unrelated colors, or placeholder business names.

### Visual Rules

Required palette:

- Navy: `#0E1A2B` or equivalent dark navy
- Gold: `#C9A24D` / `#C49A6C`
- White / light neutral backgrounds
- No red unless specifically required for an error state

### Logo Rule

Use the approved Latimore shield/logo asset only.

Do not generate, invent, substitute, redraw, or “modernize” the logo without explicit approval.

### Tone

The public tone must be:

- Professional
- Local
- Education-first
- Confident
- Trust-building
- Family and legacy centered

Avoid:

- Gimmicky copy
- Arcade-style visuals
- Overuse of emojis
- Generic national-agency language
- High-pressure sales language

---

## 2. Core Site Structure

The site must support the following major areas:

1. Home
2. About
3. Services
4. Products
5. Education
6. Contact / Booking
7. Legacy Checkup / Education Funnel
8. GBP-linked service landing pages
9. Tracking / analytics infrastructure

All routes must be stable, crawlable, and usable on mobile.

---

## 3. Primary Funnel Requirement

### Preferred Funnel Route

Use one primary public funnel route:

`/legacy-checkup`

Acceptable alias:

`/education`

The funnel must feel like a guided education experience, not a static form.

### Funnel Flow

The Legacy Checkup must include:

1. Welcome / trust screen
2. Journey selection:
   - Client
   - Business owner
   - Family protection
   - Retirement planning
   - Final expense
3. Contact capture:
   - Name
   - Email
   - Phone
   - State
   - County
4. F.O.R.M.-style relationship questions:
   - Family
   - Occupation
   - Recreation
   - Motivation
5. Protection gap questions:
   - Existing life insurance
   - Mortgage / rent obligation
   - Children / dependents
   - Retirement accounts
   - Employer benefits
   - Debt concerns
   - Final expense concern
6. Priority selection:
   - Protect family
   - Build retirement income
   - Cover final expenses
   - Protect business
   - Start children’s future planning
7. Soft education slides/cards
8. CTA:
   - Book consultation
   - Request review
   - Get quote
9. Lead routing / notification

### Funnel UX Rules

- One main action per screen
- Progress indicator required
- Mobile-first layout
- Whole card click behavior where applicable
- Buttons must be obvious and accessible
- No dead-end screens
- Final screen must push toward booking or contact

---

## 4. Service Page Hardening

Each service page must connect back to:

- The education funnel
- Booking CTA
- GBP tracking path
- Local SEO keywords
- Latimore brand story

### Required Services

The Home page and Services area must support the full menu:

1. Term Life / Mortgage Protection
2. Indexed Universal Life
3. Final Expense
4. Fixed Indexed Annuities
5. Retirement Income Planning
6. Juvenile Policies / Children’s Future Planning
7. Business Protection
8. Key Person Coverage
9. College Funding Concepts
10. Estate / Legacy Planning Basics

### Service Page CTA Rule

Each service page must include:

- Primary CTA: Start Legacy Checkup
- Secondary CTA: Book Consultation
- Optional CTA: Get Instant Quote, where appropriate

---

## 5. GBP Tracking Requirement

Google Business Profile traffic must be trackable by service.

Each GBP service link should point to a clean tracked URL.

Example structure:

```text
/services/final-expense?utm_source=google&utm_medium=business_profile&utm_campaign=gbp_services&utm_content=final_expense
```

Required UTM fields:

- `utm_source=google`
- `utm_medium=business_profile`
- `utm_campaign=gbp_services`
- `utm_content=[service-name]`

### Tracking Goal

The system must identify which service page, post, or GBP link produced the lead.

---

## 6. Analytics Requirements

The site must support:

- Google Analytics 4
- Google Tag Manager if provided
- UTM capture
- Button click tracking
- Funnel step tracking
- Booking click tracking
- Quote click tracking
- Form submission tracking

### Required Events

Track these events:

- `legacy_checkup_started`
- `legacy_checkup_step_completed`
- `legacy_checkup_completed`
- `book_consultation_clicked`
- `instant_quote_clicked`
- `service_card_clicked`
- `gbp_service_visit`
- `lead_submitted`

Analytics must not break the site if environment variables are missing.

---

## 7. CRM / Lead Routing

The system must support the Latimore pipeline:

1. New Lead
2. Contacted
3. Booked Call
4. Discovery Complete
5. Options Presented
6. App Submitted
7. Underwriting
8. Issued / Delivered
9. In Force + Review
10. Lost / Not Proceeding

### Lead Fields

Every captured lead should include:

- Name
- Email
- Phone
- State
- County
- Product interest
- Lead source
- UTM source
- UTM medium
- UTM campaign
- UTM content
- Funnel result / priority
- Created date

### Notification Rule

No Twilio dependency.

Preferred notification channel:

- Google Chat webhook
- Email fallback
- CRM/database storage fallback

---

## 8. Booking Rules

Do not add Calendly.

Approved booking path:

- Existing Fillout / booking link
- Internal booking page if later built
- Direct consultation CTA

Booking links must open cleanly on mobile.

---

## 9. Environment Variable Hardening

The app must not crash because optional environment variables are missing.

### Public Environment Variables

Expected public variables may include:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_BOOKING_URL=
NEXT_PUBLIC_ETHOS_QUOTE_URL=
```

### Server Environment Variables

Expected server variables may include:

```env
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CHAT_WEBHOOK_URL=
LEAD_NOTIFICATION_EMAIL=
```

### Rule

If an optional variable is missing:

- Disable that integration gracefully
- Log a clear warning in development
- Never expose secrets client-side

---

## 10. Supabase Hardening

If Supabase is used, the schema should support lead capture and funnel analytics.

### Suggested Tables

`leads`

Fields:

- `id`
- `created_at`
- `name`
- `email`
- `phone`
- `state`
- `county`
- `product_interest`
- `priority`
- `lead_source`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `status`

`funnel_events`

Fields:

- `id`
- `created_at`
- `session_id`
- `event_name`
- `step`
- `page_path`
- `metadata`

### Security

- Enable Row Level Security
- Do not expose service role key to frontend
- Validate form input server-side
- Rate-limit public lead endpoints where possible

---

## 11. Deployment Rules

Primary deployment target:

- Vercel

The repo must be deployable without manual file surgery.

### Build Requirements

The project must pass:

```bash
npm install
npm run lint
npm run build
```

If lint is not configured, build must still pass.

### Next.js Rules

- Avoid hardcoded localhost URLs
- Use environment variables for public URLs
- Avoid broken imports
- Avoid duplicate route conflicts
- Do not leave unused placeholder pages in production navigation

---

## 12. Mobile-First Rules

The system must work cleanly on:

- Android
- iPhone
- Chromebook
- Desktop

### Required Mobile Behavior

- Cards stack cleanly
- Buttons are thumb-friendly
- Text remains readable
- Hero does not crop essential visuals
- Backgrounds do not overpower content
- CTAs stay visible
- Forms do not require pinching/zooming

---

## 13. Accessibility Requirements

Minimum accessibility rules:

- Proper heading hierarchy
- Alt text for meaningful images
- Keyboard-accessible buttons and links
- Sufficient color contrast
- Form labels required
- Error messages must be readable
- Clickable cards must also be keyboard accessible

---

## 14. SEO Requirements

The site must support local search for:

- Life insurance in Schuylkill County
- Retirement planning in Pottsville
- Annuities in Pennsylvania
- Family protection in the Coal Region
- Life insurance for business owners
- Final expense planning in Central Pennsylvania

### Required SEO Elements

Each key page must include:

- Unique title tag
- Meta description
- Canonical URL
- Open Graph image
- Local business schema where applicable
- Internal links to related services
- Clear CTA

---

## 15. Content Guardrails

The site may educate but must not make unauthorized guarantees.

Avoid:

- Guaranteed returns language
- “Free money” framing
- Misleading IUL or annuity claims
- Unapproved carrier-specific promises
- Legal advice language
- Tax advice language

Use safer phrasing:

- “May help”
- “Can be designed to”
- “Depending on eligibility”
- “Subject to underwriting”
- “Consult a qualified professional”

---

## 16. Image / Creative Asset Rules

Every public image must be Latimore branded.

### Required Elements for GBP / Service Graphics

- Latimore logo
- Navy/gold palette
- Clear headline
- Local trust signal
- CTA
- No random stock-logo substitution
- No unrelated colors
- No fake company marks

### Graphic Naming Convention

Use clear file names:

- `latimore-gbp-final-expense.png`
- `latimore-gbp-family-protection.png`
- `latimore-gbp-retirement-income.png`
- `latimore-service-key-person.png`

---

## 17. Regression Prevention

Before any future change is accepted, verify:

- Logo did not change
- Brand colors did not drift
- Home page still shows full service menu
- Cards still click correctly
- Funnel route still works
- Booking CTA still works
- GBP links still preserve UTM tracking
- Build still passes
- Mobile layout still works
- No Twilio or Calendly dependency was reintroduced

---

## 18. Definition of Done

A task is not complete unless:

1. The site builds successfully.
2. The requested visual change is visible.
3. The Latimore brand is preserved.
4. Mobile view is checked.
5. CTA links work.
6. Funnel links work.
7. Tracking parameters are preserved.
8. No unrelated redesign was introduced.
9. No placeholder logo or fake branding appears.
10. The final result is ready for Vercel deployment.

---

## 19. Future Developer Instruction

When modifying this project:

- Do not redesign unless specifically asked.
- Do not replace the logo.
- Do not remove existing service content.
- Do not simplify away the funnel.
- Do not add new third-party tools without approval.
- Do not provide only commands when the requested output is an implemented fix or repo-ready file.
- Preserve Latimore Life & Legacy LLC as the controlling brand.

The build must serve the business first.

The standard is:

> Local trust. Clean funnel. Trackable leads. Brand consistency. Deployment-ready code.
