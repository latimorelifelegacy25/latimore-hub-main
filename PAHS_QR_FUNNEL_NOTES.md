# PAHS QR Funnel Added

## New routes
- `/pahs`
- `/pahs/start`

## Funnel behavior
1. The live dynamic QR points to `/pahs?utm_source=campusbox&utm_medium=display&utm_campaign=pahs_football_2026&utm_content=geofence_ad` (this is the convention; GA4 is case-sensitive, so keep it lowercase and never add UTMs to internal links)
2. Visitor can click Quick Quote on `/pahs`
3. `/pahs/start` captures lead into `/api/lead`
4. Visitor is then redirected to Ethos with UTM parameters

## Tracking events
- `form_start` fires once per form on first field focus (no field values sent), so landing → form start → submit drop-off can be measured.
- `StartForm` falls back to `utm_source=pahs&utm_medium=qr&utm_campaign=football2026` only when a visitor arrives with no UTMs.

## What changed
- Added bridge page inside the actual Next.js hub
- Added hub-first capture page inside the actual Next.js hub
- Used existing `/api/lead` route instead of fake local storage

## Important
Your hub API must be working in production. If `/api/lead` fails, the page will stop and show an error instead of leaking traffic straight to Ethos.
